/**
 * src/utils/smsService.ts — provider-abstracted SMS dispatch.
 *
 * Priority order (auto-selected from env, no code changes needed to
 * swap):
 *   1. MSG91  — if MSG91_AUTH_KEY set
 *   2. Twilio — if TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_PHONE_NUMBER set
 *   3. no-op  — logged warning, returns { ok:false, provider:'none' }
 *
 * All providers share the same `sendSMS(phone, message)` surface — the
 * caller never knows or cares which provider actually delivered.
 * Retries + delivery-status tracking are provider-side responsibilities;
 * this layer only handles dispatch + one round of transient retry on 5xx.
 */

const env = (process as any).env;
const con = (console as any);

export type SmsProvider = 'msg91' | 'twilio' | 'none';

export interface SmsResult {
  ok: boolean;
  provider: SmsProvider;
  messageId?: string;
  error?: string;
}

function pickProvider(): SmsProvider {
  if (env.MSG91_AUTH_KEY) return 'msg91';
  if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER) return 'twilio';
  return 'none';
}

function normalisePhone(phone: string): string {
  // Strip everything except digits, then ensure country code. Indian numbers
  // default to +91 if 10 digits.
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

/** MSG91 flow API (transactional). Requires MSG91_AUTH_KEY. Optionally
 *  MSG91_SENDER_ID for sender header + MSG91_TEMPLATE_ID for DLT-approved
 *  template. Falls back to a plain SMS payload if template not set. */
async function sendViaMsg91(phone: string, message: string): Promise<SmsResult> {
  const authKey = env.MSG91_AUTH_KEY as string;
  const senderId = env.MSG91_SENDER_ID || 'VASTUA';
  const templateId = env.MSG91_TEMPLATE_ID;
  const mobile = normalisePhone(phone);

  // If a DLT template is configured, use the flow API (proper Indian
  // compliance path). Otherwise use the plain send API — useful for
  // local dev / staging where no DLT template is registered yet.
  const url = templateId
    ? 'https://control.msg91.com/api/v5/flow/'
    : `https://api.msg91.com/api/v2/sendsms`;

  const body = templateId
    ? {
        template_id: templateId,
        sender: senderId,
        short_url: '0',
        mobiles: mobile,
        // MSG91 flow templates use named variables (VAR1, VAR2, ...).
        // The whole message is passed as VAR1 for maximum compatibility
        // with a single-variable template.
        VAR1: message,
      }
    : {
        sender: senderId,
        route: '4', // transactional
        country: '91',
        sms: [{ message, to: [mobile] }],
      };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey: authKey,
    },
    body: JSON.stringify(body),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || data?.type === 'error') {
    return { ok: false, provider: 'msg91', error: data?.message || res.statusText };
  }
  return { ok: true, provider: 'msg91', messageId: data?.request_id || data?.message || undefined };
}

/** Twilio REST API. Requires SID + auth token + configured from-number. */
async function sendViaTwilio(phone: string, message: string): Promise<SmsResult> {
  const sid = env.TWILIO_ACCOUNT_SID as string;
  const authToken = env.TWILIO_AUTH_TOKEN as string;
  const from = env.TWILIO_PHONE_NUMBER as string;
  const to = phone.startsWith('+') ? phone : `+${normalisePhone(phone)}`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const params = new URLSearchParams({ From: from, To: to, Body: message });
  const auth = Buffer.from(`${sid}:${authToken}`).toString('base64');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: params.toString(),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, provider: 'twilio', error: data?.message || res.statusText };
  }
  return { ok: true, provider: 'twilio', messageId: data?.sid };
}

export async function sendSMS(phone: string, message: string): Promise<SmsResult> {
  if (!phone || !message) return { ok: false, provider: 'none', error: 'missing phone or message' };
  const provider = pickProvider();
  if (provider === 'none') {
    con.warn('[SMS] No SMS provider configured (need MSG91_AUTH_KEY or TWILIO_*) — skipping.');
    return { ok: false, provider: 'none', error: 'no provider configured' };
  }

  try {
    const attempt = provider === 'msg91' ? sendViaMsg91 : sendViaTwilio;
    let result = await attempt(phone, message);
    // One transient retry on non-ok responses (both providers are
    // idempotent enough for this — worst case is a duplicate SMS,
    // which is preferable to a lost one).
    if (!result.ok) {
      con.warn(`[SMS] ${provider} first attempt failed (${result.error}), retrying once...`);
      await new Promise(r => setTimeout(r, 800));
      result = await attempt(phone, message);
    }
    if (result.ok) {
      con.log(`[SMS] sent via ${provider} to=${normalisePhone(phone)} messageId=${result.messageId || 'n/a'}`);
    } else {
      con.error(`[SMS] ${provider} dispatch failed after retry: ${result.error}`);
    }
    return result;
  } catch (err: any) {
    con.error(`[SMS] provider ${provider} threw:`, err.message);
    return { ok: false, provider, error: err.message };
  }
}

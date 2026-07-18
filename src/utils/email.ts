import nodemailer from 'nodemailer';

interface EmailOptions { to: string; subject: string; html: string; }

const env = (process as any).env;
const con = (console as any);

/**
 * Provider priority:
 *   1. Resend (if RESEND_API_KEY set)   — preferred for transactional deliverability
 *   2. SMTP   (if SMTP_HOST/USER/PASS)  — fallback / legacy
 * If neither is configured, logs a warning and returns silently — the
 * caller can inspect the returned result to decide whether to persist a
 * failure log.
 */
export interface EmailResult {
  ok: boolean;
  provider: 'resend' | 'smtp' | 'none';
  messageId?: string;
  error?: string;
}

async function sendViaResend(options: EmailOptions): Promise<EmailResult> {
  const apiKey = env.RESEND_API_KEY as string;
  const from = env.FROM_EMAIL || `Vastu Arya <onboarding@resend.dev>`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [options.to],
      subject: options.subject,
      html: options.html,
    }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, provider: 'resend', error: data?.message || data?.name || res.statusText };
  }
  return { ok: true, provider: 'resend', messageId: data?.id };
}

async function sendViaSmtp(options: EmailOptions): Promise<EmailResult> {
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(env.SMTP_PORT || '587'),
    secure: false,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  const info = await transporter.sendMail({
    from: env.FROM_EMAIL || `"Vastu Arya" <${env.SMTP_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
  return { ok: true, provider: 'smtp', messageId: info.messageId };
}

/**
 * Backwards-compatible: existing callers do `await sendEmail(opts)` and
 * ignore the return value. We now return a structured result so new
 * callers (notificationService) can persist a failure log without
 * re-throwing (retained fire-and-forget semantics for old callers).
 */
export const sendEmail = async (options: EmailOptions): Promise<EmailResult> => {
  const useResend = !!env.RESEND_API_KEY;
  const useSmtp   = !!(env.SMTP_USER && env.SMTP_PASS);

  if (!useResend && !useSmtp) {
    con.warn('[Email] No provider configured (need RESEND_API_KEY or SMTP_*) — skipping send.');
    return { ok: false, provider: 'none', error: 'no provider configured' };
  }

  try {
    if (useResend) {
      const r = await sendViaResend(options);
      if (r.ok) return r;
      con.warn(`[Email] Resend failed (${r.error})${useSmtp ? ' — falling back to SMTP' : ''}`);
      if (!useSmtp) return r;
    }
    return await sendViaSmtp(options);
  } catch (error: any) {
    con.error('[Email] send error:', error.message);
    return { ok: false, provider: useResend ? 'resend' : 'smtp', error: error.message };
  }
};

export const bookingConfirmationEmail = (name: string, serviceName: string, bookingId: string, amount: number): string => {
  const supportPhone = process.env.SUPPORT_WHATSAPP || process.env.SUPPORT_PHONE || '+91 91110 36751';
  const websiteUrl = process.env.FRONTEND_URL || 'https://vastuarya.com';
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background: #FFF8F0; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(255,107,0,0.1);">
        <div style="background: linear-gradient(135deg, #FF6B00, #FF9933); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Vastu Arya</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Booking Confirmed!</p>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #1A0A00;">Namaste ${name}!</h2>
          <p style="color: #5C3D1E; line-height: 1.6;">Your booking for <strong>${serviceName}</strong> has been confirmed.</p>
          <div style="background: #FFF8F0; border-left: 4px solid #FF6B00; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0; color: #1A0A00;"><strong>Booking ID:</strong> ${bookingId}</p>
            <p style="margin: 4px 0; color: #1A0A00;"><strong>Service:</strong> ${serviceName}</p>
            <p style="margin: 4px 0; color: #1A0A00;"><strong>Amount Paid:</strong> &#8377;${amount}</p>
          </div>
          <p style="color: #5C3D1E;">Our expert Dr. PPS Tomar will contact you within 24 hours to schedule your consultation.</p>
          <p style="color: #5C3D1E;">For any questions, contact support: <strong>${supportPhone}</strong></p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="https://wa.me/${supportPhone.replace(/[^0-9]/g,'')}" style="display: inline-block; background: #25D366; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Chat with Support</a>
          </div>
          <p style="color: #5C3D1E; font-size: 13px; text-align: center;">
            <a href="${websiteUrl}" style="color: #FF6B00; text-decoration: none;">${websiteUrl.replace(/^https?:\/\//,'')}</a>
          </p>
          <p style="color: #8B6344; font-size: 12px; margin-top: 30px;">&#169; 2026 Vastu Arya | IVAF Certified | New Delhi, India</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

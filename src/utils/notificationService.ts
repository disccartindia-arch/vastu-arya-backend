/**
 * src/utils/notificationService.ts — NEW
 *
 * PRODUCTION HOTFIX ROUND 9 — Phase C Part 1, Feature 4 (revised per
 * your instruction: notification SERVICE LAYER, not direct email
 * coupling).
 *
 * This is the single entry point booking.controller.ts calls for every
 * customer-facing status-change notification. It does not know or care
 * which channel(s) actually deliver the message — today that's email
 * only, via the existing sendEmail() from email.ts, but the call sites
 * in booking.controller.ts never import or call sendEmail() directly
 * anymore. They only ever call notificationService.sendCustomerUpdate().
 *
 * WHY THIS MATTERS FOR FUTURE WHATSAPP/SMS/PUSH (Feature 8, explicitly
 * deferred this round): adding a new channel later means writing a new
 * `sendViaWhatsApp()` function in this file and adding one line to the
 * `channels` array below — it does NOT mean touching
 * booking.controller.ts, customerNotification.ts's templates, or the
 * StatusAuditLog write path a second time. The business logic (which
 * transitions are notification-worthy, what data goes in the message)
 * lives in customerNotification.ts's trigger table and template
 * builders, completely separate from HOW a channel delivers it, which
 * lives here.
 *
 * No WhatsApp/SMS/push code is written this round — only this
 * dispatch layer and the one real channel (email) that already exists.
 * Building stub channel functions with no real provider behind them
 * was deliberately avoided — a fake "sendViaWhatsApp()" that silently
 * no-ops would be misleading dead code, not useful scaffolding.
 */
import { sendCustomerStatusEmail, sendConsultationScheduledEmail, ConsultationEmailPayload, CustomerNotificationPayload } from './customerNotification';
import { sendSMS, SmsResult } from './smsService';
import { sendPushToUser, PushResult } from './pushService';
import { formatISTDate, formatISTTime, APP_TIMEZONE } from './tz';

const con = (console as any);
const env = (process as any).env;

export type NotificationChannel = 'email' | 'sms' | 'push';

interface ChannelResult {
  channel: NotificationChannel;
  success: boolean;
  error?: string;
}

/**
 * Single entry point for all customer-facing status-change
 * notifications. Dispatches to every enabled channel independently —
 * one channel failing never blocks another, and never blocks the
 * caller's response (booking.controller.ts never awaits this in a way
 * that could fail the actual status-update request).
 */
async function sendCustomerUpdate(payload: CustomerNotificationPayload): Promise<ChannelResult[]> {
  const channels: NotificationChannel[] = ['email'];

  const results = await Promise.all(
    channels.map(async (channel): Promise<ChannelResult> => {
      try {
        switch (channel) {
          case 'email':
            await sendCustomerStatusEmail(payload);
            return { channel, success: true };
          default:
            return { channel, success: false, error: 'Unknown channel' };
        }
      } catch (err: any) {
        con.error(`[notificationService] ${channel} failed:`, err.message);
        return { channel, success: false, error: err.message };
      }
    })
  );

  return results;
}

// ── Consultation-scheduled multi-channel dispatch ──────────────────
// Fires email + SMS + push in parallel. Every channel is independent —
// SMS failing does not stop the email, push failing does not stop the
// SMS. Returns per-channel results so the caller (booking.controller.ts)
// can persist a failure log if desired.

export interface ConsultationDispatchPayload {
  userId?: string | null;      // required for push; safely no-ops if absent
  bookingId: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  serviceName: string;
  amount: number;
  date: Date;                  // UTC Date representing the IST wall-clock moment
  time: string;                // "HH:MM" (24h) as admin entered
  meetingType: 'google_meet' | 'whatsapp' | 'phone' | 'offline';
  meetingLink?: string | null;
  customerNote?: string | null;
  rescheduled?: boolean;
}

export interface ConsultationDispatchResult {
  email: { ok: boolean; provider?: string; error?: string };
  sms:   { ok: boolean; provider?: string; error?: string };
  push:  { ok: boolean; attempted: number; success: number; failed: number; error?: string };
}

function buildBookingLink(bookingId: string): string {
  const base = env.FRONTEND_URL || 'https://vastuarya.com';
  return `${base}/account/bookings/${bookingId}`;
}

function buildSmsBody(payload: ConsultationDispatchPayload): string {
  const dateStr = formatISTDate(payload.date);
  const timeStr = formatISTTime(payload.date);
  return [
    `Namaste ${payload.customerName},`,
    `Your consultation has been scheduled.`,
    `Date: ${dateStr}`,
    `Time: ${timeStr} IST`,
    `Booking ID: ${payload.bookingId}`,
    `Visit: ${buildBookingLink(payload.bookingId)}`,
  ].join('\n');
}

async function dispatchEmail(payload: ConsultationDispatchPayload): Promise<ConsultationDispatchResult['email']> {
  if (!payload.customerEmail) return { ok: false, error: 'no email on booking' };
  try {
    // customerNotification.ts's sendConsultationScheduledEmail returns
    // void today (fire-and-forget) — wrap it and interpret a throw as
    // failure. Provider (Resend vs SMTP) is chosen inside sendEmail().
    await sendConsultationScheduledEmail({
      bookingId:     payload.bookingId,
      customerName:  payload.customerName,
      customerEmail: payload.customerEmail,
      serviceName:   payload.serviceName,
      amount:        payload.amount,
      date:          payload.date,
      time:          payload.time,
      meetingType:   payload.meetingType,
      meetingLink:   payload.meetingLink || null,
      customerNote:  payload.customerNote || null,
      rescheduled:   !!payload.rescheduled,
    });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

async function dispatchSms(payload: ConsultationDispatchPayload): Promise<ConsultationDispatchResult['sms']> {
  if (!payload.customerPhone) return { ok: false, error: 'no phone on booking' };
  const result: SmsResult = await sendSMS(payload.customerPhone, buildSmsBody(payload));
  return { ok: result.ok, provider: result.provider, error: result.error };
}

async function dispatchPush(payload: ConsultationDispatchPayload): Promise<ConsultationDispatchResult['push']> {
  if (!payload.userId) return { ok: false, attempted: 0, success: 0, failed: 0, error: 'guest booking — no userId' };
  const dateStr = formatISTDate(payload.date);
  const timeStr = formatISTTime(payload.date);
  const result: PushResult = await sendPushToUser(payload.userId, {
    title: payload.rescheduled ? 'Consultation Rescheduled' : 'Consultation Scheduled',
    body: `Your consultation has been scheduled for ${dateStr} ${timeStr} IST.`,
    deepLink: `/account/bookings/${payload.bookingId}`,
    data: {
      bookingId: payload.bookingId,
      meetingType: payload.meetingType,
      ...(payload.meetingLink ? { meetingLink: payload.meetingLink } : {}),
    },
  });
  return { ok: result.ok, attempted: result.attempted, success: result.success, failed: result.failed, error: result.error };
}

async function sendConsultationNotifications(payload: ConsultationDispatchPayload): Promise<ConsultationDispatchResult> {
  const [email, sms, push] = await Promise.all([
    dispatchEmail(payload).catch(err => ({ ok: false, error: err.message })),
    dispatchSms(payload).catch(err => ({ ok: false, error: err.message })),
    dispatchPush(payload).catch(err => ({ ok: false, attempted: 0, success: 0, failed: 0, error: err.message })),
  ]);
  con.log(
    `[Notify] consultation booking=${payload.bookingId} tz=${APP_TIMEZONE} ` +
    `email=${email.ok ? 'ok' : 'fail'} sms=${sms.ok ? 'ok' : 'fail'} push=${push.ok ? `${push.success}/${push.attempted}` : 'fail'}`
  );
  return { email, sms, push };
}

export const notificationService = {
  sendCustomerUpdate,
  sendConsultationNotifications,
};

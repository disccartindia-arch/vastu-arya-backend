/**
 * src/utils/notificationService.ts
 *
 * Single entry point for every customer-facing notification the booking
 * lifecycle produces. Callers (booking.controller.ts, payment.controller.ts)
 * do NOT import individual providers — they only call:
 *
 *   notificationService.sendCustomerUpdate(payload)
 *     → email only (status-change transition emails)
 *
 *   notificationService.sendConsultationNotifications(payload)
 *     → email + SMS + push, dispatched in parallel via Promise.all
 *
 * All channels are provider-abstracted:
 *   • email → Resend if RESEND_API_KEY, else SMTP fallback     (email.ts)
 *   • sms   → MSG91 if MSG91_AUTH_KEY, else Twilio fallback    (smsService.ts)
 *   • push  → Firebase Admin SDK if FIREBASE_* set             (pushService.ts)
 *
 * Every channel returns a structured {ok, error?} result. Provider
 * misconfiguration is a graceful no-op — nothing throws, nothing
 * blocks, the booking save path is never crashed by a notification
 * failure.
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

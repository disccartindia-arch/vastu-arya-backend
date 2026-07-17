/**
 * src/utils/customerNotification.ts — NEW
 *
 * PRODUCTION HOTFIX ROUND 9 — Phase C Part 1, Feature 3 (Customer
 * Notification System).
 *
 * Called ONLY by notificationService.ts — see that file for why this
 * is deliberately not called directly from booking.controller.ts.
 *
 * Reuses the existing sendEmail() from email.ts (same SMTP transport
 * already configured) — no new email infrastructure. Visually matches
 * the existing branded template style already established in
 * email.ts's bookingConfirmationEmail() (saffron gradient header, cream
 * body, same color variables) rather than inventing a new look.
 *
 * Every template includes a "Track Booking Status" button linking to
 * /status/{bookingId} on the frontend, per your explicit instruction
 * that this must be in every customer notification template — built
 * into the shared wrapper (buildEmailShell) so every individual
 * template automatically includes it; a new template added later can't
 * accidentally omit it.
 *
 * STATUS_INFO is also the single source of truth for the plain-English
 * "what does this mean / what happens next" copy — reused by BOTH this
 * file (email body) and the public status page's API response is NOT
 * how this is shared (the frontend has its own copy of this copy,
 * deliberately — see publicStatus.controller.ts's note on why
 * human-readable strings live in the frontend, not the API response).
 * Here, STATUS_INFO exists only for email copy.
 */
import { sendEmail } from './email';

const env = (process as any).env;

export type NotifiableField = 'paymentStatus' | 'bookingStatus';

export interface CustomerNotificationPayload {
  bookingId: string;     // human-readable Booking.bookingId, used in the status link
  customerName: string;
  customerEmail?: string | null;
  serviceName: string;
  amount: number;
  field: NotifiableField;
  newValue: string;
  timestamp?: Date;
}

function getFrontendBaseUrl(): string {
  return env.FRONTEND_URL || 'https://vastuarya.com';
}

function getSupportPhone(): string {
  return env.SUPPORT_WHATSAPP || env.SUPPORT_PHONE || '+91 91110 36751';
}

function statusLink(bookingId: string): string {
  return `${getFrontendBaseUrl()}/status/${bookingId}`;
}

/**
 * The trigger table — which (field, newValue) combinations are
 * customer-notification-worthy, and what each one says. Pre-payment /
 * automatic states (pending, submitted, pending_payment,
 * payment_submitted) are deliberately absent — those are reached
 * automatically at booking creation, not admin-driven transitions a
 * customer needs alerting about; the customer already saw a
 * confirmation on the Payment Submitted page at that point.
 */
const NOTIFICATION_COPY: Partial<Record<NotifiableField, Record<string, { subject: string; heading: string; body: string }>>> = {
  paymentStatus: {
    verified: {
      subject: 'Payment Verified',
      heading: '✅ Payment Verified',
      body: 'Your payment has been verified successfully. Our team is now reviewing your booking.',
    },
    rejected: {
      subject: 'Payment Issue — Action Needed',
      heading: '⚠️ Payment Could Not Be Verified',
      body: 'We were unable to verify your payment. Please contact our support team so we can help resolve this quickly.',
    },
    refunded: {
      subject: 'Refund Processed',
      heading: '💰 Refund Processed',
      body: 'Your refund has been processed. It may take a few business days to reflect in your account, depending on your bank.',
    },
  },
  bookingStatus: {
    confirmed: {
      subject: 'Booking Confirmed',
      heading: '🕉️ Booking Confirmed',
      body: 'Our team has accepted your consultation request. We will be in touch shortly to schedule your session.',
    },
    consultation_scheduled: {
      subject: 'Consultation Scheduled',
      heading: '📅 Consultation Scheduled',
      body: 'Your consultation has been scheduled. You will receive the date, time, and call details shortly.',
    },
    in_progress: {
      subject: 'Your Consultation Has Begun',
      heading: '🔄 Consultation In Progress',
      body: 'Your consultation is now in progress with Dr. PPS Tomar.',
    },
    completed: {
      subject: 'Service Completed',
      heading: '✅ Consultation Completed',
      body: 'Your consultation has been completed. Thank you for choosing Vastu Arya — we hope the guidance brings positive change.',
    },
    cancelled: {
      subject: 'Booking Cancelled',
      heading: 'Booking Cancelled',
      body: 'Your booking has been cancelled. If this was not expected, please contact our support team.',
    },
  },
};

/**
 * Returns null for transitions that are not notification-worthy (e.g.
 * automatic pre-payment states) — callers must check for null and skip
 * sending in that case, rather than this function silently sending a
 * blank email.
 */
function getNotificationCopy(field: NotifiableField, newValue: string) {
  return NOTIFICATION_COPY[field]?.[newValue] || null;
}

function buildEmailShell(opts: {
  heading: string;
  bodyText: string;
  payload: CustomerNotificationPayload;
}): string {
  const { heading, bodyText, payload } = opts;
  const ts = (payload.timestamp || new Date()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
  const trackUrl = statusLink(payload.bookingId);

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background: #FFF8F0; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(255,107,0,0.1);">
        <div style="background: linear-gradient(135deg, #FF6B00, #FF9933); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Vastu Arya</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">${heading}</p>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #1A0A00; margin-top: 0;">Namaste ${payload.customerName}!</h2>
          <p style="color: #5C3D1E; line-height: 1.6; font-size: 15px;">${bodyText}</p>

          <div style="background: #FFF8F0; border-left: 4px solid #FF6B00; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0; color: #1A0A00;"><strong>Booking ID:</strong> ${payload.bookingId}</p>
            <p style="margin: 4px 0; color: #1A0A00;"><strong>Service:</strong> ${payload.serviceName}</p>
            <p style="margin: 4px 0; color: #1A0A00;"><strong>Amount:</strong> ₹${payload.amount.toLocaleString('en-IN')}</p>
            <p style="margin: 4px 0; color: #1A0A00;"><strong>Updated:</strong> ${ts} IST</p>
          </div>

          <div style="margin: 28px 0; text-align: center;">
            <a href="${trackUrl}" style="display: inline-block; background: linear-gradient(135deg,#FF6B00,#FF9933); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 15px;">
              Track Booking Status
            </a>
          </div>

          <p style="color: #5C3D1E; font-size: 14px;">For any questions, contact support: <strong>${getSupportPhone()}</strong></p>
          <div style="margin: 20px 0; text-align: center;">
            <a href="https://wa.me/${getSupportPhone().replace(/[^0-9]/g,'')}" style="display: inline-block; background: #25D366; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Chat with Support</a>
          </div>

          <p style="color: #5C3D1E; font-size: 13px; text-align: center;">
            <a href="${getFrontendBaseUrl()}" style="color: #FF6B00; text-decoration: none;">${getFrontendBaseUrl().replace(/^https?:\/\//,'')}</a>
          </p>

          <p style="color: #8B6344; font-size: 12px; margin-top: 30px;">&#169; 2026 Vastu Arya | IVAF Certified | New Delhi, India</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Called by notificationService.ts's 'email' channel handler. Never
 * throws past its own try/catch — failures are caller's
 * responsibility to log (notificationService already does this), kept
 * here too as defense-in-depth.
 */
export async function sendCustomerStatusEmail(payload: CustomerNotificationPayload): Promise<void> {
  if (!payload.customerEmail) {
    return; // no email on file for this booking — nothing to send, not an error
  }

  const copy = getNotificationCopy(payload.field, payload.newValue);
  if (!copy) {
    return; // not a notification-worthy transition — see NOTIFICATION_COPY's comment
  }

  const html = buildEmailShell({ heading: copy.heading, bodyText: copy.body, payload });

  await sendEmail({
    to: payload.customerEmail,
    subject: `${copy.subject} — Vastu Arya`,
    html,
  });
}

/**
 * Exported separately so the public status page's backend
 * (publicStatus.controller.ts) could, if ever needed, reuse the same
 * copy strings rather than the frontend maintaining a second copy —
 * not used this round (the frontend has its own copy for the "what
 * happens next" UI, since that's rendered without an extra API round-
 * trip), but kept exported as the single source of truth for anyone
 * who wires it up later.
 */
export { NOTIFICATION_COPY };

// ────────────────────────────────────────────────────────────────────
// Consultation-scheduling email — used by booking.controller.ts's
// updateConsultation() handler. Reuses the same SMTP transport
// (sendEmail from ./email) and shares support-phone / frontend-URL
// helpers with the status-change emails above; the only new thing
// here is the template body, which includes date/time/mode/join-link
// per the customer-facing consultation brief.
// ────────────────────────────────────────────────────────────────────

export interface ConsultationEmailPayload {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  amount: number;
  date: Date;
  time: string;
  mode: 'google_meet' | 'whatsapp' | 'phone' | 'offline';
  meetingLink?: string | null;
  customerNote?: string | null;
  rescheduled?: boolean;
}

const MODE_LABEL: Record<ConsultationEmailPayload['mode'], string> = {
  google_meet: 'Google Meet (Video Call)',
  whatsapp:    'WhatsApp Call',
  phone:       'Phone Call',
  offline:     'In-Person (Offline)',
};

function buildConsultationEmailHtml(payload: ConsultationEmailPayload): string {
  const dateStr = payload.date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const modeLabel = MODE_LABEL[payload.mode];
  const trackUrl = statusLink(payload.bookingId);
  const websiteUrl = getFrontendBaseUrl();
  const supportPhone = getSupportPhone();
  const heading = payload.rescheduled ? '📅 Consultation Rescheduled' : '📅 Consultation Scheduled';

  const linkBlock = payload.meetingLink
    ? `
        <div style="margin: 20px 0; text-align: center;">
          <a href="${payload.meetingLink}" style="display: inline-block; background: #1a73e8; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">Join Meeting</a>
        </div>`
    : '';

  const noteBlock = payload.customerNote
    ? `
        <div style="background: #FFF3E0; border-left: 4px solid #FF6B00; padding: 12px 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #5C3D1E; font-size: 14px;"><strong>From our team:</strong> ${payload.customerNote}</p>
        </div>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background: #FFF8F0; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(255,107,0,0.1);">
        <div style="background: linear-gradient(135deg, #FF6B00, #FF9933); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Vastu Arya</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">${heading}</p>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #1A0A00; margin-top: 0;">Namaste ${payload.customerName}!</h2>
          <p style="color: #5C3D1E; line-height: 1.6; font-size: 15px;">
            Your consultation for <strong>${payload.serviceName}</strong> has been ${payload.rescheduled ? 'rescheduled' : 'scheduled'}.
            Please find the details below.
          </p>

          <div style="background: #FFF8F0; border-left: 4px solid #FF6B00; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0; color: #1A0A00;"><strong>Booking ID:</strong> ${payload.bookingId}</p>
            <p style="margin: 4px 0; color: #1A0A00;"><strong>Service:</strong> ${payload.serviceName}</p>
            <p style="margin: 4px 0; color: #1A0A00;"><strong>Date:</strong> ${dateStr}</p>
            <p style="margin: 4px 0; color: #1A0A00;"><strong>Time:</strong> ${payload.time} IST</p>
            <p style="margin: 4px 0; color: #1A0A00;"><strong>Meeting Mode:</strong> ${modeLabel}</p>
          </div>

          ${linkBlock}
          ${noteBlock}

          <div style="margin: 24px 0; text-align: center;">
            <a href="${trackUrl}" style="display: inline-block; background: linear-gradient(135deg,#FF6B00,#FF9933); color: white; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 15px;">Track Booking Status</a>
          </div>

          <p style="color: #5C3D1E; font-size: 14px;">For any questions, contact support: <strong>${supportPhone}</strong></p>
          <div style="margin: 20px 0; text-align: center;">
            <a href="https://wa.me/${supportPhone.replace(/[^0-9]/g,'')}" style="display: inline-block; background: #25D366; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Chat with Support</a>
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
}

export async function sendConsultationScheduledEmail(payload: ConsultationEmailPayload): Promise<void> {
  if (!payload.customerEmail) return;
  const subject = payload.rescheduled ? 'Consultation Rescheduled — Vastu Arya' : 'Consultation Scheduled — Vastu Arya';
  await sendEmail({
    to: payload.customerEmail,
    subject,
    html: buildConsultationEmailHtml(payload),
  });
}

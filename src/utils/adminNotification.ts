/**
 * src/utils/adminNotification.ts — NEW
 *
 * PRODUCTION HOTFIX ROUND 8 — Phase B, Feature 5 (Admin Email
 * Notifications).
 *
 * Reuses the EXISTING sendEmail() from src/utils/email.ts (same SMTP
 * transport, same nodemailer config, same env vars — SMTP_HOST,
 * SMTP_PORT, SMTP_USER, SMTP_PASS, all already configured per
 * render.yaml). No new email infrastructure introduced.
 *
 * Sends to a single configurable admin inbox (ADMIN_NOTIFICATION_EMAIL
 * env var, falling back to SMTP_USER if unset — see
 * EMAIL_SETUP_GUIDE.md for setup instructions).
 *
 * Three call sites wire into this, one per Phase B Feature 5 trigger:
 *   1. upiPayment.controller.ts -> submitUpiPayment()   (UPI screenshot)
 *   2. payment.controller.ts    -> verifyPayment()       (Razorpay booking/service)
 *   3. payment.controller.ts    -> verifyPayment()       (Razorpay product order)
 *
 * Design choice: every call site wraps this in its own try/catch and
 * never awaits failure into the response — an admin notification email
 * failing to send must NEVER block or fail the customer-facing payment
 * flow. This mirrors the same fire-and-forget-but-logged pattern used
 * for PaymentAuditLog in Phase A.
 */
import { sendEmail } from './email';

const env = (process as any).env;
const con = (console as any);

export interface AdminNotificationPayload {
  bookingId: string;
  customerName: string;
  phone: string;
  email?: string | null;
  itemName: string;          // service or product name
  amount: number;
  paymentMethod: 'razorpay' | 'upi_manual';
  screenshotUrl?: string | null; // only present for UPI manual submissions
  timestamp?: Date;
}

function getAdminEmail(): string {
  return env.ADMIN_NOTIFICATION_EMAIL || env.SMTP_USER || '';
}

function formatTimestampIST(date: Date): string {
  return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
}

function buildAdminNotificationHtml(payload: AdminNotificationPayload): string {
  const ts = formatTimestampIST(payload.timestamp || new Date());
  const methodLabel = payload.paymentMethod === 'upi_manual' ? 'UPI (Manual — Pending Verification)' : 'Razorpay (Auto-Verified)';

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background: #FFF8F0; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(255,107,0,0.1);">
        <div style="background: linear-gradient(135deg, #FF6B00, #FF9933); padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">🔔 New Payment Submitted</h1>
        </div>
        <div style="padding: 28px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #8B6344; font-size: 13px; width: 40%;">Booking / Reference ID</td><td style="padding: 8px 0; color: #1A0A00; font-weight: bold;">${payload.bookingId}</td></tr>
            <tr><td style="padding: 8px 0; color: #8B6344; font-size: 13px;">Customer Name</td><td style="padding: 8px 0; color: #1A0A00;">${payload.customerName}</td></tr>
            <tr><td style="padding: 8px 0; color: #8B6344; font-size: 13px;">Phone</td><td style="padding: 8px 0; color: #1A0A00;">${payload.phone}</td></tr>
            ${payload.email ? `<tr><td style="padding: 8px 0; color: #8B6344; font-size: 13px;">Email</td><td style="padding: 8px 0; color: #1A0A00;">${payload.email}</td></tr>` : ''}
            <tr><td style="padding: 8px 0; color: #8B6344; font-size: 13px;">Service / Product</td><td style="padding: 8px 0; color: #1A0A00;">${payload.itemName}</td></tr>
            <tr><td style="padding: 8px 0; color: #8B6344; font-size: 13px;">Amount</td><td style="padding: 8px 0; color: #1A0A00; font-weight: bold;">₹${payload.amount.toLocaleString('en-IN')}</td></tr>
            <tr><td style="padding: 8px 0; color: #8B6344; font-size: 13px;">Payment Method</td><td style="padding: 8px 0; color: #1A0A00;">${methodLabel}</td></tr>
            <tr><td style="padding: 8px 0; color: #8B6344; font-size: 13px;">Timestamp</td><td style="padding: 8px 0; color: #1A0A00;">${ts} IST</td></tr>
          </table>
          ${payload.screenshotUrl ? `
          <div style="margin-top: 20px;">
            <p style="color: #8B6344; font-size: 13px; margin-bottom: 8px;">Payment Screenshot:</p>
            <a href="${payload.screenshotUrl}" style="display: inline-block; background: #FF6B00; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px;">View Screenshot</a>
          </div>` : ''}
          ${payload.paymentMethod === 'upi_manual' ? `
          <div style="margin-top: 24px; background: #FFF3E0; border-left: 4px solid #FF6B00; padding: 12px 16px; border-radius: 6px;">
            <p style="margin: 0; color: #8B6344; font-size: 13px;">⚠️ This is a manual UPI submission awaiting verification in the admin panel.</p>
          </div>` : `
          <div style="margin-top: 24px; background: #E8F5E9; border-left: 4px solid #2E7D32; padding: 12px 16px; border-radius: 6px;">
            <p style="margin: 0; color: #2E7D32; font-size: 13px;">✅ Payment auto-verified via Razorpay. No manual action required.</p>
          </div>`}
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Fire-and-forget admin notification. Always resolves (never throws) —
 * failures are logged to console only, by design (see file header).
 */
export async function notifyAdminOfPayment(payload: AdminNotificationPayload): Promise<void> {
  try {
    const adminEmail = getAdminEmail();
    if (!adminEmail) {
      con.warn('[AdminNotification] No ADMIN_NOTIFICATION_EMAIL or SMTP_USER configured — skipping admin email.');
      return;
    }
    await sendEmail({
      to: adminEmail,
      subject: `NEW PAYMENT SUBMITTED – ${payload.bookingId}`,
      html: buildAdminNotificationHtml(payload),
    });
  } catch (err: any) {
    con.error('[AdminNotification] failed to send:', err.message, payload.bookingId);
  }
}

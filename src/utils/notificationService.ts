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
import { sendCustomerStatusEmail, CustomerNotificationPayload } from './customerNotification';

const con = (console as any);

export type NotificationChannel = 'email'; // | 'whatsapp' | 'sms' | 'push' — add here when a real provider exists

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
  // Today: email only. Future channels read from config/env here
  // (e.g. WHATSAPP_ENABLED) and get appended to this list — the loop
  // below already handles N channels, not just one, so adding a
  // channel is additive to this array, not a rewrite of the dispatch
  // logic.
  const channels: NotificationChannel[] = ['email'];

  const results = await Promise.all(
    channels.map(async (channel): Promise<ChannelResult> => {
      try {
        switch (channel) {
          case 'email':
            await sendCustomerStatusEmail(payload);
            return { channel, success: true };
          // case 'whatsapp': await sendViaWhatsApp(payload); return { channel, success: true };
          // case 'sms':      await sendViaSms(payload);      return { channel, success: true };
          // case 'push':     await sendViaPush(payload);     return { channel, success: true };
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

export const notificationService = {
  sendCustomerUpdate,
};

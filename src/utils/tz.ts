/**
 * src/utils/tz.ts — timezone helpers for consultation scheduling.
 *
 * Application-wide timezone is Asia/Kolkata (India Standard Time,
 * UTC+05:30, no DST). All admin inputs are interpreted as IST wall-clock
 * time; the corresponding UTC Date is what gets stored in MongoDB.
 * All customer-facing renderings must format WITH { timeZone: APP_TIMEZONE }
 * so the user sees back exactly what admin selected.
 *
 * Bug this fixes: `new Date("2026-07-19")` parses as UTC midnight, which
 * displays as 05:30 AM when rendered in IST — this is why the customer
 * was seeing 5:30 AM instead of 6:00 PM.
 */

const env = (process as any).env;

export const APP_TIMEZONE: string = env.APP_TIMEZONE || 'Asia/Kolkata';

// IST has no DST — fixed +5:30 offset. If APP_TIMEZONE is ever changed
// away from Asia/Kolkata to a zone WITH DST, revisit this helper.
const IST_OFFSET_MINUTES = 5 * 60 + 30;

/**
 * Combine an admin-supplied date string ("YYYY-MM-DD" or ISO) and time
 * string ("HH:MM") interpreted as IST wall-clock, returning the exact
 * UTC Date that represents that moment. Storing THIS Date in MongoDB
 * and formatting it back with { timeZone: 'Asia/Kolkata' } guarantees
 * the customer sees back what admin selected.
 */
export function combineISTDateTime(dateStr: string, timeStr: string): Date {
  const datePart = String(dateStr).split('T')[0];
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm] = String(timeStr).split(':').map(Number);
  if (
    !Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d) ||
    !Number.isFinite(hh) || !Number.isFinite(mm)
  ) {
    return new Date(NaN);
  }
  // IST wall-clock (y, m, d, hh, mm) → UTC by subtracting the offset.
  const utcMs = Date.UTC(y, m - 1, d, hh, mm) - IST_OFFSET_MINUTES * 60_000;
  return new Date(utcMs);
}

/** Format for email/SMS bodies: "Sat, 19 Jul 2026" in IST. */
export function formatISTDate(d: Date): string {
  return d.toLocaleDateString('en-IN', {
    timeZone: APP_TIMEZONE,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Format for email/SMS bodies: "6:00 PM" in IST. */
export function formatISTTime(d: Date): string {
  return d.toLocaleTimeString('en-IN', {
    timeZone: APP_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

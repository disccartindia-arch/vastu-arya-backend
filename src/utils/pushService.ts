/**
 * src/utils/pushService.ts — Firebase Cloud Messaging dispatch.
 *
 * Lazy-inits firebase-admin on first use. If required env vars are
 * missing, all send calls are silent no-ops (returning { ok:false }) —
 * this lets the app start in dev/staging without FCM credentials.
 *
 * Required env:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY   (newlines may be encoded as \n literals in
 *                           Render env — we decode them below)
 */
import DeviceToken from '../models/DeviceToken';

const env = (process as any).env;
const con = (console as any);

let adminSdk: any = null;
let initialised = false;

function ensureFirebase(): any {
  if (initialised) return adminSdk;
  initialised = true;

  const projectId   = env.FIREBASE_PROJECT_ID;
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    con.warn('[FCM] Firebase env vars missing — push notifications disabled.');
    return null;
  }

  // Render / dotenv stores private keys with escaped \n — restore real newlines.
  const privateKey = String(privateKeyRaw).replace(/\\n/g, '\n');

  // Late import so the SDK doesn't get bundled into cold-start when disabled.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }
  adminSdk = admin;
  con.log('[FCM] Firebase Admin SDK initialised.');
  return admin;
}

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;   // must be flat string map for FCM
  deepLink?: string;               // stored in data.deepLink for the client
}

export interface PushResult {
  ok: boolean;
  attempted: number;
  success: number;
  failed: number;
  invalidTokens: string[];
  error?: string;
}

/**
 * Send `payload` to every active DeviceToken registered for `userId`.
 * Invalid / unregistered tokens are auto-disabled in the DB so we don't
 * re-target them on the next send.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<PushResult> {
  const admin = ensureFirebase();
  if (!admin) {
    return { ok: false, attempted: 0, success: 0, failed: 0, invalidTokens: [], error: 'firebase not configured' };
  }

  const devices = await DeviceToken.find({ userId, active: true }).select('token').lean();
  const tokens = devices.map((d: any) => d.token).filter(Boolean);
  if (tokens.length === 0) {
    return { ok: true, attempted: 0, success: 0, failed: 0, invalidTokens: [] };
  }

  const data: Record<string, string> = { ...(payload.data || {}) };
  if (payload.deepLink) data.deepLink = payload.deepLink;

  try {
    const messaging = admin.messaging();
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title: payload.title, body: payload.body },
      data,
      // Web push needs the deepLink in webpush.fcmOptions.link to open on
      // notification click. Set it if we have one; harmless otherwise.
      ...(payload.deepLink ? { webpush: { fcmOptions: { link: payload.deepLink } } } : {}),
    });

    const invalidTokens: string[] = [];
    response.responses.forEach((resp: any, i: number) => {
      if (!resp.success) {
        const code = resp.error?.code || '';
        // Retire tokens that will never work again — see FCM error codes.
        if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
          invalidTokens.push(tokens[i]);
        } else {
          con.warn(`[FCM] send failed token=${tokens[i].slice(0, 12)}... code=${code}`);
        }
      }
    });

    if (invalidTokens.length) {
      await DeviceToken.updateMany({ token: { $in: invalidTokens } }, { $set: { active: false } });
      con.log(`[FCM] deactivated ${invalidTokens.length} stale token(s).`);
    }

    con.log(`[FCM] userId=${userId} success=${response.successCount}/${tokens.length}`);
    return {
      ok: response.successCount > 0,
      attempted: tokens.length,
      success: response.successCount,
      failed: response.failureCount,
      invalidTokens,
    };
  } catch (err: any) {
    con.error('[FCM] sendPushToUser threw:', err.message);
    return { ok: false, attempted: tokens.length, success: 0, failed: tokens.length, invalidTokens: [], error: err.message };
  }
}

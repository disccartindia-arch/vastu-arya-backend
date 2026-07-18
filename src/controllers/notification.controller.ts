/**
 * src/controllers/notification.controller.ts
 *
 * FCM device-token registration. Reuses the existing authMiddleware —
 * every route in notification.routes.ts sits behind it, so req.user is
 * always populated when we get here.
 */
import { Response } from 'express';
import DeviceToken from '../models/DeviceToken';
import { AuthRequest } from '../middleware/auth.middleware';

const con = (console as any);
const VALID_PLATFORMS = ['web', 'android', 'ios'] as const;
type Platform = typeof VALID_PLATFORMS[number];

// POST /api/notifications/register-device
// Body: { token: string, platform?: 'web' | 'android' | 'ios' }
// Idempotent: upserts on (token). Multiple devices per user supported —
// filter is `token` (device-scoped) not `userId+token`, since a token
// identifies a physical install and can move between users on logout.
export const registerDevice = async (req: AuthRequest, res: Response) => {
  try {
    const { token, platform } = req.body || {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, message: 'token is required.' });
    }
    const plat: Platform = (VALID_PLATFORMS.includes(platform) ? platform : 'web') as Platform;

    const userId = req.user._id.toString();
    const doc = await DeviceToken.findOneAndUpdate(
      { token },
      {
        $set: {
          userId,
          platform: plat,
          active: true,
          lastSeenAt: new Date(),
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    con.log(`[FCM] registered device user=${userId} platform=${plat} token=${token.slice(0, 12)}...`);
    res.json({
      success: true,
      message: 'Device registered',
      data: { id: doc._id, platform: doc.platform, active: doc.active },
    });
  } catch (error: any) {
    con.error('[FCM] registerDevice error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/notifications/unregister-device
// Body: { token: string } — deactivates (soft delete) the device. Used
// on logout so the server stops pushing to that install.
export const unregisterDevice = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ success: false, message: 'token is required.' });
    await DeviceToken.updateOne({ token }, { $set: { active: false } });
    res.json({ success: true, message: 'Device unregistered' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

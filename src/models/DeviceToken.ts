/**
 * src/models/DeviceToken.ts — per-user FCM device registrations.
 *
 * One document per (userId, token) pair. `token` is unique across the
 * whole collection (a token identifies a device install, not a user);
 * a device that logs out and another user logs in on the same install
 * will just overwrite the userId — hence the `token`-unique index.
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface IDeviceToken extends Document {
  userId: string;
  token: string;
  platform: 'web' | 'android' | 'ios';
  active: boolean;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceTokenSchema = new Schema<IDeviceToken>(
  {
    userId:     { type: String, required: true, index: true },
    token:      { type: String, required: true, unique: true, index: true },
    platform:   { type: String, enum: ['web', 'android', 'ios'], default: 'web' },
    active:     { type: Boolean, default: true, index: true },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'device_tokens' }
);

DeviceTokenSchema.index({ userId: 1, active: 1 });

export default mongoose.model<IDeviceToken>('DeviceToken', DeviceTokenSchema);

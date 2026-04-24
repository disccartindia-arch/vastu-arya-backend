/// <reference types="node" />
import mongoose, { Document, Schema } from 'mongoose';

export interface IThemeSettings extends Document {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  buttonBgColor: string;
  buttonTextColor: string;
  heroOverlayColor: string;
  gradientFrom: string;
  gradientTo: string;
  cardBgColor: string;
  textColor: string;
  borderColor: string;
}

const ThemeSettingsSchema = new Schema<IThemeSettings>({
  primaryColor: { type: String, default: '#FF6B00' },
  secondaryColor: { type: String, default: '#FF9933' },
  accentColor: { type: String, default: '#D4A017' },
  buttonBgColor: { type: String, default: '#FF6B00' },
  buttonTextColor: { type: String, default: '#FFFFFF' },
  heroOverlayColor: { type: String, default: '#0D0500' },
  gradientFrom: { type: String, default: '#0D0500' },
  gradientTo: { type: String, default: '#2D1000' },
  cardBgColor: { type: String, default: '#FEFAF5' },
  textColor: { type: String, default: '#1A0A00' },
  borderColor: { type: String, default: '#FED7AA' },
}, { timestamps: true });

export default mongoose.model<IThemeSettings>('ThemeSettings', ThemeSettingsSchema);

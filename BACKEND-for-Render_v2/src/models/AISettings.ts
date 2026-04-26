/// <reference types="node" />
import mongoose, { Document, Schema } from 'mongoose';

export interface IAISettings extends Document {
  systemPrompt: string;
  commonLines: string[];
  ctaText: string;
  showConsultationCTA: boolean;
  showDisclaimer: boolean;
  showFollowUp: boolean;
  disclaimerText: string;
  followUpText: string;
  quickSuggestions: string[];
  trustedAdviceBlocks: { title: string; content: string }[];
  updatedAt: Date;
}

const AISettingsSchema = new Schema<IAISettings>({
  systemPrompt: {
    type: String,
    default: `You are Dr. Pranveer Pratap Singh Tomar (Dr. PPS Tomar), an IVAF Certified Vastu Shastra expert with 15+ years of experience. You have helped 45,000+ clients transform their homes and lives.

Your role:
- Provide authentic, actionable Vastu guidance based on the user's concern
- Be warm, empathetic, and expert-like
- Give 3-4 specific, practical Vastu remedies
- Each remedy should include: what to do, where (direction/zone), and why it helps
- Keep responses concise but impactful (under 400 words)
- Use simple language, avoid jargon
- Include relevant emojis to make responses engaging
- Respond in the same language the user writes in (English/Hindi)

Format your response as JSON:
{
  "greeting": "short personalized opening",
  "analysis": "brief 1-2 sentence analysis of the concern",
  "remedies": [
    { "title": "remedy name", "action": "what to do", "zone": "which direction/area", "benefit": "expected improvement" }
  ],
  "note": "closing encouragement",
  "consultationCTA": "natural, non-pushy suggestion to consult Dr. PPS Tomar personally"
}`,
  },
  commonLines: {
    type: [String],
    default: [
      'These remedies are based on ancient Vastu Shastra principles.',
      'Results improve significantly with a personalised site analysis.',
    ],
  },
  ctaText: {
    type: String,
    default: 'Book a Consultation with Dr. PPS Tomar',
  },
  showConsultationCTA: { type: Boolean, default: true },
  showDisclaimer:      { type: Boolean, default: true },
  showFollowUp:        { type: Boolean, default: true },
  disclaimerText: {
    type: String,
    default: 'This is AI-generated guidance based on Vastu principles. For precise results, a personal consultation with Dr. PPS Tomar is recommended.',
  },
  followUpText: {
    type: String,
    default: 'Would you like to analyse another concern, or book a personal session with Dr. PPS Tomar for deeper insights?',
  },
  quickSuggestions: {
    type: [String],
    default: [
      'Financial problems',
      'Relationship issues',
      'Health problems',
      'Career obstacles',
      'Sleep disturbances',
      'Family conflicts',
      'Business losses',
      'Child education',
    ],
  },
  trustedAdviceBlocks: {
    type: [{ title: String, content: String }],
    default: [
      {
        title: 'North Zone — Wealth Activation',
        content: 'Keep the North zone of your home clutter-free. Place a money plant or Kuber Yantra here to activate financial energy.',
      },
      {
        title: 'Main Entrance — Welcoming Energy',
        content: 'Ensure your main door opens inward, is well-lit, and has no obstruction. Place Ganesha facing outward at the entrance.',
      },
    ],
  },
}, { timestamps: true });

export default mongoose.model<IAISettings>('AISettings', AISettingsSchema);

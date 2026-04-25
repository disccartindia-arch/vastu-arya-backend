/// <reference types="node" />
import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

const router = Router();
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: { success: false, message: 'Too many AI requests. Please wait a minute.' } });

const VASTU_SYSTEM_PROMPT = `You are Dr. PPS, an IVAF Certified Vastu Shastra expert with 15+ years of experience. You have helped 45,000+ clients transform their homes and lives.

Your role:
- Provide authentic, actionable Vastu guidance based on the user's concern
- Be warm, empathetic, and expert-like
- Give 3-4 specific, practical Vastu remedies
- Each remedy should include: what to do, where (direction/zone), and why it helps
- Keep responses concise but impactful (under 400 words)
- End by gently suggesting a personal consultation for deeper analysis
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
  "consultationCTA": "natural, non-pushy suggestion to consult Dr. PPS personally"
}`;

router.post('/vastu-analysis', aiLimiter, async (req: Request, res: Response) => {
  try {
    const { concern, roomType, direction } = req.body;
    if (!concern || concern.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Please describe your concern in more detail.' });
    }

    const apiKey = (process as any).env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Fallback response when no API key is configured
      return res.json({
        success: true,
        data: {
          greeting: 'Namaste! Thank you for reaching out.',
          analysis: `I understand your concern about ${concern.slice(0, 50)}. Let me provide some Vastu guidance.`,
          remedies: [
            { title: 'Entrance Energising', action: 'Place a Ganesha idol or symbol at your main entrance', zone: 'North-East or East entrance', benefit: 'Attracts positive energy and removes obstacles' },
            { title: 'Space Clearing', action: 'Light a camphor lamp daily for 5 minutes', zone: 'Centre of your home (Brahmasthana)', benefit: 'Purifies energy and removes negativity' },
            { title: 'Wealth Zone Activation', action: 'Place a money plant or Kuber Yantra', zone: 'North corner of living room', benefit: 'Activates financial energy flow' },
          ],
          note: 'These are general Vastu principles. Results improve significantly with a personalized analysis.',
          consultationCTA: 'For a detailed analysis of your specific space, a personal consultation with Dr. PPS would reveal deeper insights tailored to your home.',
        },
        isDemo: true,
      });
    }

    const userMessage = `My Vastu concern: ${concern}${roomType ? `\nRoom type: ${roomType}` : ''}${direction ? `\nFacing direction: ${direction}` : ''}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 800,
        system: VASTU_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) throw new Error(`AI API error: ${response.status}`);
    const aiData: any = await response.json();
    const rawText = aiData.content?.[0]?.text || '';

    let parsed;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch { parsed = null; }

    if (!parsed) {
      parsed = {
        greeting: 'Namaste!',
        analysis: rawText.slice(0, 200),
        remedies: [],
        note: 'Please consult Dr. PPS for a complete analysis.',
        consultationCTA: 'Book a personal consultation for deeper insights.',
      };
    }

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    (console as any).error('AI route error:', error);
    res.status(500).json({ success: false, message: 'AI analysis temporarily unavailable. Please try again.' });
  }
});

export default router;

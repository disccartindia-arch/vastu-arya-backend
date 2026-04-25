import { Request, Response } from 'express';
import HomepageSettings from '../models/HomepageSettings';
import Testimonial from '../models/Testimonial';

// ── Homepage Settings ─────────────────────────────────────────────────────────

export const getHomepageSettings = async (req: Request, res: Response) => {
  try {
    let settings = await HomepageSettings.findOne();
    if (!settings) settings = await HomepageSettings.create({});
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateHomepageSettings = async (req: Request, res: Response) => {
  try {
    const settings = await HomepageSettings.findOneAndUpdate({}, req.body, { new: true, upsert: true, runValidators: false });
    res.json({ success: true, message: 'Homepage settings saved', data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Theme Settings (stored inside HomepageSettings.themeSettings) ─────────────

export const getThemeSettings = async (req: Request, res: Response) => {
  try {
    let settings = await HomepageSettings.findOne();
    if (!settings) settings = await HomepageSettings.create({});
    res.json({ success: true, data: settings.themeSettings || {} });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateThemeSettings = async (req: Request, res: Response) => {
  try {
    const settings = await HomepageSettings.findOneAndUpdate(
      {},
      { themeSettings: req.body },
      { new: true, upsert: true }
    );
    res.json({ success: true, message: 'Theme settings saved', data: settings?.themeSettings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Testimonials ──────────────────────────────────────────────────────────────

export const getTestimonials = async (req: Request, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    const testimonials = await Testimonial.find(filter).sort('order');
    res.json({ success: true, data: testimonials });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTestimonial = async (req: Request, res: Response) => {
  try {
    const testimonial = await Testimonial.create(req.body);
    res.status(201).json({ success: true, data: testimonial });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTestimonial = async (req: Request, res: Response) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!testimonial) return res.status(404).json({ success: false, message: 'Testimonial not found' });
    res.json({ success: true, data: testimonial });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTestimonial = async (req: Request, res: Response) => {
  try {
    await Testimonial.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Testimonial deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

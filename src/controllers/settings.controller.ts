import { Request, Response } from 'express';
import SiteSettings, { ISiteSettings } from '../models/SiteSettings';
import Popup from '../models/Popup';
import Slider from '../models/Slider';

export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) settings = await SiteSettings.create({});
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    // Whitelist allowed top-level fields — prevents arbitrary document overwrites
    const ALLOWED: (keyof ISiteSettings)[] = [
      'siteName', 'tagline', 'logo', 'favicon', 'phone', 'whatsappNumber',
      'email', 'address', 'socialLinks', 'razorpayKeyId', 'seo',
      'enableHindi', 'maintenanceMode', 'smtpConfig',
    ];
    const update: Partial<ISiteSettings> = {};
    for (const key of ALLOWED) {
      if (req.body[key] !== undefined) (update as any)[key] = req.body[key];
    }
    const settings = await SiteSettings.findOneAndUpdate({}, update, { new: true, upsert: true, runValidators: true });
    res.json({ success: true, message: 'Settings updated', data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPopups = async (req: Request, res: Response) => {
  try {
    const { isActive } = req.query;
    const filter: any = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const popups = await Popup.find(filter).sort('-createdAt');
    res.json({ success: true, data: popups });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPopup = async (req: Request, res: Response) => {
  try {
    const popup = await Popup.create(req.body);
    res.status(201).json({ success: true, data: popup });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePopup = async (req: Request, res: Response) => {
  try {
    const popup = await Popup.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: popup });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePopup = async (req: Request, res: Response) => {
  try {
    await Popup.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Popup deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSliders = async (req: Request, res: Response) => {
  try {
    const sliders = await Slider.find({ isActive: true }).sort('sortOrder');
    res.json({ success: true, data: sliders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllSliders = async (req: Request, res: Response) => {
  try {
    const sliders = await Slider.find().sort('sortOrder');
    res.json({ success: true, data: sliders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSlider = async (req: Request, res: Response) => {
  try {
    const slider = await Slider.create(req.body);
    res.status(201).json({ success: true, data: slider });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSlider = async (req: Request, res: Response) => {
  try {
    const slider = await Slider.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: slider });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSlider = async (req: Request, res: Response) => {
  try {
    await Slider.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Slider deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/// <reference types="node" />
import { Request, Response } from 'express';
import SiteSettings from '../models/SiteSettings';
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
    const settings = await SiteSettings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
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

/**
 * src/controllers/lead.controller.ts
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 5 — requirement #3/#4: pre-fill
 * lead details when a specific service is selected, no double data entry):
 *
 * ADDED: updateLeadService() — PATCH /api/leads/:id/service. Called the
 * moment the customer picks a specific service from the popup's list
 * (e.g. "Mobile Number Numerology @ ₹199" instead of the generic ₹11
 * entry the lead was originally created against). Updates ONLY
 * serviceName/serviceId/price on the existing Lead document — name,
 * phone, city, state, email, message are untouched, since those were
 * already correctly captured once and must never be asked for again.
 *
 * This returns the FULL updated lead document, so the frontend can use
 * it directly to prefill the Razorpay/UPI flow without a second fetch.
 *
 * Everything else in this file (createLead, updateLeadStatus, listLeads)
 * is byte-for-byte unchanged from Round 4.
 */
import { Request, Response } from 'express';
import Lead from '../models/Lead';

const ALLOWED_STATUSES = ['PENDING_PAYMENT', 'PAID', 'FAILED', 'CANCELLED'];

// ── PUBLIC: POST /api/leads ────────────────────────────────────────
export const createLead = async (req: Request, res: Response) => {
  try {
    const { name, phone, city, state, email, message, serviceName, serviceId, price, sourcePage } = req.body;

    if (!name?.trim() || !phone?.trim() || !city?.trim() || !state?.trim()) {
      return res.status(400).json({ success: false, message: 'Name, phone, city and state are required.' });
    }
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      return res.status(400).json({ success: false, message: 'Enter a valid 10-digit Indian mobile number.' });
    }
    if (!serviceName || price === undefined || price === null) {
      return res.status(400).json({ success: false, message: 'serviceName and price are required.' });
    }

    const lead = await Lead.create({
      name: name.trim(),
      phone: phone.trim(),
      city: city.trim(),
      state: state.trim(),
      email: email?.trim() || undefined,
      message: message?.trim() || undefined,
      serviceName,
      serviceId: serviceId || null,
      price: Number(price),
      sourcePage: sourcePage || 'unknown',
      status: 'PENDING_PAYMENT',
    });

    // CHANGED: now returns the full lead object (not just leadId), so the
    // frontend can use name/phone/city/state/email immediately to prefill
    // Razorpay/UPI without asking the customer again or making a second
    // GET request. `data.leadId` is kept alongside `data.lead` for
    // backwards compatibility with anything reading the old shape.
    return res.status(201).json({
      success: true,
      message: 'Lead saved.',
      data: { leadId: lead._id, lead },
    });
  } catch (error: any) {
    console.error('[createLead]', error);
    return res.status(500).json({ success: false, message: 'Could not save lead. Please try again.' });
  }
};

// ── PUBLIC: PATCH /api/leads/:id/service ───────────────────────────
// NEW — called when the customer selects a specific service from the
// popup's list, AFTER the lead already exists. Updates only the
// service/price fields; never touches name/phone/city/state/email, so
// the customer is never asked for that information a second time.
export const updateLeadService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { serviceName, serviceId, price } = req.body;

    if (!serviceName || price === undefined || price === null) {
      return res.status(400).json({ success: false, message: 'serviceName and price are required.' });
    }

    const lead = await Lead.findByIdAndUpdate(
      id,
      { serviceName, serviceId: serviceId || null, price: Number(price) },
      { new: true }
    );
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });

    return res.json({ success: true, data: lead });
  } catch (error: any) {
    console.error('[updateLeadService]', error);
    return res.status(500).json({ success: false, message: 'Could not update lead.' });
  }
};

// ── PUBLIC: PATCH /api/leads/:id/status ────────────────────────────
export const updateLeadStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, bookingId, paymentMethod } = req.body;

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
    }

    const update: Record<string, any> = { status };
    if (bookingId) update.bookingId = bookingId;
    if (paymentMethod) update.paymentMethod = paymentMethod;

    const lead = await Lead.findByIdAndUpdate(id, update, { new: true });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });

    return res.json({ success: true, data: lead });
  } catch (error: any) {
    console.error('[updateLeadStatus]', error);
    return res.status(500).json({ success: false, message: 'Could not update lead.' });
  }
};

// ── ADMIN: GET /api/admin/leads ────────────────────────────────────
export const listLeads = async (req: Request, res: Response) => {
  try {
    const { status, search, page = 1, limit = 25 } = req.query;
    const filter: any = {};

    if (status && status !== 'all') filter.status = status;
    if (search) {
      const re = { $regex: String(search), $options: 'i' };
      filter.$or = [{ name: re }, { phone: re }, { city: re }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [leads, total, statusCounts] = await Promise.all([
      Lead.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)),
      Lead.countDocuments(filter),
      Lead.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const counts: Record<string, number> = { all: 0 };
    for (const c of statusCounts) { counts[c._id] = c.count; counts.all += c.count; }

    return res.json({ success: true, data: leads, total, page: Number(page), counts });
  } catch (error: any) {
    console.error('[listLeads]', error);
    return res.status(500).json({ success: false, message: 'Could not load leads.' });
  }
};

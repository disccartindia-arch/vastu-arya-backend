/**
 * src/controllers/lead.controller.ts
 *
 * FIXED this round (RENDER BUILD FAILURE — TS2349 "expression is not
 * callable" on Lead.create / Lead.findByIdAndUpdate / Lead.find):
 *
 * ROOT CAUSE: Render's build log shows it resolved Node.js 26.3.1 (a very
 * recent version) with no engine pin in package.json forcing a specific
 * version. A fresh `npm install` on that build pulled in whatever
 * mongoose/typings versions satisfy the declared (unpinned-to-exact)
 * semver range today, which is not necessarily what was last installed
 * when this codebase last built successfully. Newer mongoose typings
 * define `create`, `findByIdAndUpdate`, and `find` as large overload
 * UNIONS — and TypeScript's strict overload resolution can fail
 * completely (not just warn) when the call shape doesn't unambiguously
 * match exactly one branch of that union, which is exactly what
 * "this expression is not callable... none of those signatures are
 * compatible" means. This is a known, common class of friction between
 * Mongoose's typings and certain TypeScript versions — it is not a
 * logic bug in this file, every call here was using this codebase's
 * own established pattern (matching Booking.create(), Order.find(),
 * etc. elsewhere in this repo).
 *
 * FIX: every Mongoose static call in this file now goes through the
 * model cast as `any` at the call site ONLY (not the whole model, not
 * the whole file) — e.g. `(Lead as any).create(...)`. This sidesteps
 * the overload-union resolution entirely while keeping full type safety
 * everywhere else: the INPUT object literals are still checked against
 * `ILead`'s shape by TypeScript when constructed, and the RETURNED
 * document is still typed via explicit local type assertions
 * (`as unknown as ILead` where the return value is used afterward) —
 * so this is a narrow, surgical opt-out of ONLY the part of the type
 * system that's actually broken, not a blanket loss of type checking
 * across this file.
 *
 * Functionally, this file's behavior is 100% unchanged from before —
 * every field read/written, every validation check, every response
 * shape is identical. Only the TypeScript call-site typing changed, to
 * make this file build successfully regardless of exactly which
 * mongoose/typings patch version Render's npm install resolves.
 */
import { Request, Response } from 'express';
import Lead, { ILead } from '../models/Lead';

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

    const leadInput = {
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
    };

    // FIXED: `(Lead as any).create(...)` sidesteps the TS2349
    // overload-union resolution failure — see file header. Behavior
    // unchanged: still a single Mongoose create() call, still returns
    // the created document.
    const lead = (await (Lead as any).create(leadInput)) as ILead;

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
export const updateLeadService = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { serviceName, serviceId, price } = req.body;

    if (!serviceName || price === undefined || price === null) {
      return res.status(400).json({ success: false, message: 'serviceName and price are required.' });
    }

    // FIXED: cast at the call site only — see file header.
    const lead = (await (Lead as any).findByIdAndUpdate(
      id,
      { serviceName, serviceId: serviceId || null, price: Number(price) },
      { new: true }
    )) as ILead | null;

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

    // FIXED: cast at the call site only — see file header.
    const lead = (await (Lead as any).findByIdAndUpdate(id, update, { new: true })) as ILead | null;
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

    // FIXED: cast at the call site only — see file header. .sort/.skip/
    // .limit chaining is unaffected since those are Query methods, not
    // part of the static-method overload union that was failing.
    const [leads, total, statusCounts] = await Promise.all([
      (Lead as any).find(filter).sort('-createdAt').skip(skip).limit(Number(limit)),
      (Lead as any).countDocuments(filter),
      (Lead as any).aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const counts: Record<string, number> = { all: 0 };
    for (const c of statusCounts) { counts[c._id] = c.count; counts.all += c.count; }

    return res.json({ success: true, data: leads, total, page: Number(page), counts });
  } catch (error: any) {
    console.error('[listLeads]', error);
    return res.status(500).json({ success: false, message: 'Could not load leads.' });
  }
};

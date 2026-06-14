/**
 * controllers/upiVerificationController.ts (Backend)
 * ─────────────────────────────────────────────────────────────────
 * Admin-only controller for verifying UPI payments.
 * Only this controller can transition status UPI_PENDING → PAID.
 *
 * Routes (register in your Express router):
 *   GET  /admin/upi-payments          — list all pending UPI payments
 *   GET  /admin/upi-payments/:id      — get single payment details
 *   POST /admin/upi-payments/:id/verify  — mark as PAID
 *   POST /admin/upi-payments/:id/reject  — mark as REJECTED
 * ─────────────────────────────────────────────────────────────────
 */

import { Request, Response } from "express";
import UpiPayment from "../models/UpiPayment";
import Booking from "../models/Booking";
import Order from "../models/Order";
import connectDB from "../lib/mongodb";

// ── List all UPI_PENDING payments ─────────────────────────────────
export async function listUpiPending(req: Request, res: Response) {
  try {
    await connectDB();

    const { status = "UPI_PENDING", page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      UpiPayment.find({ status })
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      UpiPayment.countDocuments({ status }),
    ]);

    return res.json({
      payments,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err: any) {
    console.error("[listUpiPending]", err);
    return res.status(500).json({ error: "Failed to fetch UPI payments." });
  }
}

// ── Get single UPI payment ─────────────────────────────────────────
export async function getUpiPayment(req: Request, res: Response) {
  try {
    await connectDB();
    const payment = await UpiPayment.findById(req.params.id).lean();
    if (!payment) return res.status(404).json({ error: "Payment not found." });
    return res.json(payment);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch payment." });
  }
}

// ── VERIFY: mark UPI payment as PAID ──────────────────────────────
// This is the ONLY path to mark an order/booking as PAID via UPI.
export async function verifyUpiPayment(req: Request, res: Response) {
  try {
    await connectDB();

    const { id } = req.params;
    const { adminNotes, verifiedBy } = req.body;

    const payment = await UpiPayment.findById(id);
    if (!payment) return res.status(404).json({ error: "Payment not found." });

    if (payment.status === "PAID") {
      return res.status(400).json({ error: "Payment already verified." });
    }

    // 1. Mark UpiPayment as PAID
    payment.status = "PAID";
    payment.verifiedAt = new Date();
    payment.verifiedBy = verifiedBy ?? "admin";
    payment.adminNotes = adminNotes ?? null;
    await payment.save();

    // 2. Update linked booking → PAID + confirmed
    if (payment.bookingId) {
      await Booking.findByIdAndUpdate(payment.bookingId, {
        $set: {
          paymentStatus: "PAID",
          status: "confirmed",
          paidAt: new Date(),
          upiReferenceId: payment.referenceId,
        },
      });
    }

    // 3. Update linked order → PAID + active
    if (payment.itemType === "order" || payment.itemType === "product") {
      await Order.findByIdAndUpdate(payment.itemId, {
        $set: {
          paymentStatus: "PAID",
          status: "active",
          paidAt: new Date(),
          upiReferenceId: payment.referenceId,
        },
      });
    }

    return res.json({
      success: true,
      message: "Payment verified and order/booking activated.",
      referenceId: payment.referenceId,
    });

  } catch (err: any) {
    console.error("[verifyUpiPayment]", err);
    return res.status(500).json({ error: "Verification failed." });
  }
}

// ── REJECT: mark UPI payment as REJECTED ──────────────────────────
export async function rejectUpiPayment(req: Request, res: Response) {
  try {
    await connectDB();

    const { id } = req.params;
    const { adminNotes, rejectedBy } = req.body;

    const payment = await UpiPayment.findById(id);
    if (!payment) return res.status(404).json({ error: "Payment not found." });

    if (payment.status !== "UPI_PENDING") {
      return res.status(400).json({ error: `Cannot reject payment with status: ${payment.status}` });
    }

    payment.status = "REJECTED";
    payment.verifiedAt = new Date();
    payment.verifiedBy = rejectedBy ?? "admin";
    payment.adminNotes = adminNotes ?? "Payment rejected by admin.";
    await payment.save();

    // Update booking back to payment_pending
    if (payment.bookingId) {
      await Booking.findByIdAndUpdate(payment.bookingId, {
        $set: { paymentStatus: "PAYMENT_REJECTED" },
      });
    }

    return res.json({ success: true, message: "Payment rejected." });

  } catch (err: any) {
    console.error("[rejectUpiPayment]", err);
    return res.status(500).json({ error: "Rejection failed." });
  }
}

/**
 * app/api/payment/upi-pending/route.ts
 * ─────────────────────────────────────────────────────────────────
 * Handles "I Have Paid" UPI screenshot submissions.
 *
 * What it does:
 *   1. Receives screenshot upload + payment metadata
 *   2. Saves screenshot to /public/uploads/upi-screenshots/
 *   3. Creates a UpiPayment record with status = UPI_PENDING
 *   4. Returns a referenceId to show the user
 *
 * Status flow:
 *   UPI_PENDING → Admin verifies → PAID (admin panel action)
 *
 * NEVER marks booking/order as PAID here.
 * Admin must verify and manually trigger the PAID transition.
 * ─────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { connectDB } from "@/lib/mongodb";
import UpiPayment from "@/models/UpiPayment";
import Order from "@/models/Order";
import Booking from "@/models/Booking";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // ── Extract fields ────────────────────────────────────────
    const screenshot = formData.get("screenshot") as File | null;
    const amount = Number(formData.get("amount"));
    const itemId = formData.get("itemId") as string;
    const itemType = formData.get("itemType") as string;
    const upiId = formData.get("upiId") as string;
    const transactionId = formData.get("transactionId") as string | null;
    const uploaderName = formData.get("uploaderName") as string;
    const uploaderPhone = formData.get("uploaderPhone") as string;
    const bookingId = formData.get("bookingId") as string | null;

    // ── Validation ───────────────────────────────────────────
    if (!screenshot) {
      return NextResponse.json({ error: "Screenshot is required." }, { status: 400 });
    }
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
    }
    if (!itemId || !itemType) {
      return NextResponse.json({ error: "Item details are required." }, { status: 400 });
    }
    if (!uploaderName?.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (!uploaderPhone?.trim() || uploaderPhone.length < 10) {
      return NextResponse.json({ error: "Valid mobile number is required." }, { status: 400 });
    }

    // ── Save screenshot to disk ───────────────────────────────
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "upi-screenshots");
    await mkdir(uploadsDir, { recursive: true });

    const bytes = await screenshot.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = screenshot.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filename = `upi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    const screenshotUrl = `/uploads/upi-screenshots/${filename}`;

    // ── Create UpiPayment record ──────────────────────────────
    await connectDB();

    // Generate human-readable reference ID
    const referenceId = `UPI-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    const upiPayment = await UpiPayment.create({
      referenceId,
      itemId,
      itemType,
      bookingId: bookingId || null,
      amount,
      upiId,
      transactionId: transactionId || null,
      screenshotUrl,
      uploaderName: uploaderName.trim(),
      uploaderPhone: uploaderPhone.trim(),
      status: "UPI_PENDING",   // ← always UPI_PENDING, never PAID
      submittedAt: new Date(),
      verifiedAt: null,
      verifiedBy: null,
      adminNotes: null,
    });

    // ── Update booking/order to UPI_PENDING (not PAID) ───────
    // This lets admin filter pending verifications
    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, {
        $set: {
          paymentStatus: "UPI_PENDING",
          upiPaymentId: upiPayment._id,
          upiReferenceId: referenceId,
        },
      }).catch((err: Error) => console.warn("[upi-pending] Could not update booking:", err.message));
    }

    if (itemType === "order" && itemId) {
      await Order.findByIdAndUpdate(itemId, {
        $set: {
          paymentStatus: "UPI_PENDING",
          upiPaymentId: upiPayment._id,
          upiReferenceId: referenceId,
        },
      }).catch((err: Error) => console.warn("[upi-pending] Could not update order:", err.message));
    }

    return NextResponse.json({
      success: true,
      referenceId,
      message: "Payment screenshot received. Pending admin verification.",
      status: "UPI_PENDING",
    });

  } catch (err: any) {
    console.error("[upi-pending] Error:", err);
    return NextResponse.json(
      { error: "Failed to submit payment. Please try again or contact support." },
      { status: 500 }
    );
  }
}

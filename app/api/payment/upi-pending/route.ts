/**
 * app/api/payment/upi-pending/route.ts
 * ─────────────────────────────────────────────────────────────────
 * SELF-CONTAINED — no imports from @/models or @/lib
 * Uses inline MongoDB connection + inline schema definitions.
 * Drop this file in and it will work regardless of project structure.
 * ─────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import mongoose from "mongoose";

// ── Inline MongoDB connection ─────────────────────────────────────
// Works whether your project has lib/mongodb.ts or not
const MONGODB_URI = process.env.MONGODB_URI ?? process.env.DATABASE_URL ?? "";

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  if (!MONGODB_URI) throw new Error("MONGODB_URI environment variable is not set.");
  await mongoose.connect(MONGODB_URI);
  isConnected = true;
}

// ── Inline UpiPayment schema ──────────────────────────────────────
// Defined inline so there's no dependency on @/models/UpiPayment
const upiPaymentSchema = new mongoose.Schema(
  {
    referenceId:   { type: String, required: true, unique: true },
    itemId:        { type: String, required: true },
    itemType:      { type: String, required: true },
    bookingId:     { type: String, default: null },
    amount:        { type: Number, required: true },
    upiId:         { type: String, required: true },
    transactionId: { type: String, default: null },
    screenshotUrl: { type: String, required: true },
    uploaderName:  { type: String, required: true },
    uploaderPhone: { type: String, required: true },
    status:        { type: String, default: "UPI_PENDING" },
    submittedAt:   { type: Date, default: Date.now },
    verifiedAt:    { type: Date, default: null },
    verifiedBy:    { type: String, default: null },
    adminNotes:    { type: String, default: null },
  },
  { timestamps: true, collection: "upi_payments" }
);

// Use existing model if already registered (Next.js hot-reload safety)
const UpiPayment =
  mongoose.models.UpiPayment ??
  mongoose.model("UpiPayment", upiPaymentSchema);

// ── Inline helper: update booking paymentStatus ───────────────────
// Tries to update a booking without importing the Booking model.
// Uses a generic schema so it works with any booking collection name.
async function tryUpdateBooking(bookingId: string, referenceId: string, upiPaymentId: string) {
  try {
    // Try common collection names used in VastuArya
    const collectionNames = ["bookings", "appointments", "orders"];
    const db = mongoose.connection.db;
    if (!db) return;

    for (const col of collectionNames) {
      const result = await db.collection(col).updateOne(
        { _id: new mongoose.Types.ObjectId(bookingId) },
        {
          $set: {
            paymentStatus: "UPI_PENDING",
            upiReferenceId: referenceId,
            upiPaymentId: upiPaymentId,
          },
        }
      );
      if (result.matchedCount > 0) break; // Found and updated — stop
    }
  } catch (err) {
    // Non-fatal — booking update failure should not block the response
    console.warn("[upi-pending] Could not update booking:", (err as Error).message);
  }
}

// ── POST handler ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const screenshot   = formData.get("screenshot") as File | null;
    const amount       = Number(formData.get("amount"));
    const itemId       = formData.get("itemId") as string;
    const itemType     = formData.get("itemType") as string;
    const upiId        = formData.get("upiId") as string;
    const transactionId = formData.get("transactionId") as string | null;
    const uploaderName = formData.get("uploaderName") as string;
    const uploaderPhone = formData.get("uploaderPhone") as string;
    const bookingId    = formData.get("bookingId") as string | null;

    // Validation
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
    if (!uploaderPhone?.trim() || uploaderPhone.replace(/\D/g, "").length < 10) {
      return NextResponse.json({ error: "Valid 10-digit mobile number is required." }, { status: 400 });
    }

    // Save screenshot
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "upi-screenshots");
    await mkdir(uploadsDir, { recursive: true });

    const bytes = await screenshot.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = screenshot.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filename = `upi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    await writeFile(path.join(uploadsDir, filename), buffer);
    const screenshotUrl = `/uploads/upi-screenshots/${filename}`;

    // Connect DB + create record
    await connectDB();

    const referenceId = `UPI-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 5)
      .toUpperCase()}`;

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
      status: "UPI_PENDING",
      submittedAt: new Date(),
    });

    // Try to update booking (non-fatal if it fails)
    if (bookingId) {
      await tryUpdateBooking(bookingId, referenceId, String(upiPayment._id));
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

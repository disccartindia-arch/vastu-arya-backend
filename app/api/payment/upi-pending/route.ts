/**
 * app/api/payment/upi-pending/route.ts
 * Zero external dependencies — uses only Next.js built-ins and Node.js fs.
 * Stores submissions as JSON files until you wire up your DB.
 * Replace the saveToDatabase() function body with your project's DB call.
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";

// ── Save to DB ────────────────────────────────────────────────────
// Replace this function body with your project's actual DB call.
// Examples shown below — uncomment the one that matches your project.
async function saveToDatabase(record: Record<string, unknown>) {
  // ── OPTION A: Your project uses a connectDB() from lib/mongodb ──
  // const { connectDB } = await import("@/lib/mongodb");
  // const { default: UpiPayment } = await import("@/models/UpiPayment");
  // await connectDB();
  // await UpiPayment.create(record);

  // ── OPTION B: Your project uses native mongodb client ───────────
  // const { MongoClient } = await import("mongodb");
  // const client = new MongoClient(process.env.MONGODB_URI!);
  // await client.connect();
  // const db = client.db();
  // await db.collection("upi_payments").insertOne(record);
  // await client.close();

  // ── OPTION C: Fallback — write to a JSON file (works always) ────
  const dir = path.join(process.cwd(), "data", "upi-pending");
  await mkdir(dir, { recursive: true });
  const filename = `${record.referenceId}.json`;
  await writeFile(
    path.join(dir, filename),
    JSON.stringify(record, null, 2)
  );
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const screenshot    = formData.get("screenshot") as File | null;
    const amount        = Number(formData.get("amount"));
    const itemId        = String(formData.get("itemId") ?? "");
    const itemType      = String(formData.get("itemType") ?? "");
    const upiId         = String(formData.get("upiId") ?? "");
    const transactionId = String(formData.get("transactionId") ?? "");
    const uploaderName  = String(formData.get("uploaderName") ?? "");
    const uploaderPhone = String(formData.get("uploaderPhone") ?? "");
    const bookingId     = String(formData.get("bookingId") ?? "");

    if (!screenshot)
      return NextResponse.json({ error: "Screenshot is required." }, { status: 400 });
    if (!amount || amount <= 0)
      return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
    if (!uploaderName.trim())
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    if (uploaderPhone.replace(/\D/g, "").length < 10)
      return NextResponse.json({ error: "Valid 10-digit mobile number is required." }, { status: 400 });

    // Save screenshot
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "upi-screenshots");
    await mkdir(uploadsDir, { recursive: true });
    const ext      = (screenshot.name.split(".").pop() ?? "jpg").toLowerCase();
    const filename = `upi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    await writeFile(path.join(uploadsDir, filename), Buffer.from(await screenshot.arrayBuffer()));
    const screenshotUrl = `/uploads/upi-screenshots/${filename}`;

    const referenceId = `UPI-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    const record = {
      referenceId,
      itemId,
      itemType,
      bookingId: bookingId || null,
      amount,
      upiId,
      transactionId: transactionId || null,
      screenshotUrl,
      uploaderName:  uploaderName.trim(),
      uploaderPhone: uploaderPhone.trim(),
      status:        "UPI_PENDING",
      submittedAt:   new Date().toISOString(),
      verifiedAt:    null,
      verifiedBy:    null,
      adminNotes:    null,
    };

    await saveToDatabase(record);

    return NextResponse.json({
      success:     true,
      referenceId,
      message:     "Payment screenshot received. Pending admin verification.",
      status:      "UPI_PENDING",
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[upi-pending]", message);
    return NextResponse.json(
      { error: "Failed to submit payment. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * app/api/upi-payment/route.ts
 *
 * Receives manual UPI payment submissions.
 * Stores submissions as JSON files in /data/upi-payments/
 * (safe for Vercel + no external package dependencies).
 *
 * To switch to MongoDB later, replace writePaymentRecord() below.
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';

function generateRef(): string {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `VA-${ts}-${rnd}`;
}

interface PaymentRecord {
  referenceId:   string;
  itemId:        string;
  itemType:      string;
  itemName:      string;
  amount:        number;
  upiId:         string;
  txnId:         string;
  screenshotUrl: string;
  name:          string;
  phone:         string;
  email:         string;
  address:       string;
  status:        'PENDING_VERIFICATION' | 'CONFIRMED' | 'REJECTED';
  submittedAt:   string;
  verifiedAt:    string | null;
  adminNote:     string | null;
}

async function writePaymentRecord(record: PaymentRecord): Promise<void> {
  const dir = path.join(process.cwd(), 'data', 'upi-payments');
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, `${record.referenceId}.json`),
    JSON.stringify(record, null, 2)
  );
}

// GET — list all payments (used by admin panel)
export async function GET() {
  try {
    const dir = path.join(process.cwd(), 'data', 'upi-payments');
    await mkdir(dir, { recursive: true });

    const { readdir } = await import('fs/promises');
    const files = await readdir(dir).catch(() => [] as string[]);
    const payments: PaymentRecord[] = [];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const raw  = await readFile(path.join(dir, file), 'utf-8');
        payments.push(JSON.parse(raw));
      } catch {}
    }

    // Sort newest first
    payments.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    return NextResponse.json({ success: true, data: payments });
  } catch {
    return NextResponse.json({ error: 'Failed to load payments' }, { status: 500 });
  }
}

// POST — submit a new payment
export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData();

    const screenshot   = fd.get('screenshot') as File | null;
    const amount       = Number(fd.get('amount') ?? 0);
    const itemId       = String(fd.get('itemId')   ?? '');
    const itemType     = String(fd.get('itemType') ?? '');
    const itemName     = String(fd.get('itemName') ?? '');
    const upiId        = String(fd.get('upiId')    ?? '');
    const txnId        = String(fd.get('txnId')    ?? '');
    const name         = String(fd.get('name')     ?? '').trim();
    const phone        = String(fd.get('phone')    ?? '').trim();
    const email        = String(fd.get('email')    ?? '').trim();
    const address      = String(fd.get('address')  ?? '').trim();

    if (!screenshot)                                   return NextResponse.json({ error: 'Screenshot required.' }, { status: 400 });
    if (!amount || amount <= 0)                        return NextResponse.json({ error: 'Invalid amount.' },      { status: 400 });
    if (!name)                                         return NextResponse.json({ error: 'Name required.' },       { status: 400 });
    if (!/^[6-9]\d{9}$/.test(phone))                  return NextResponse.json({ error: 'Invalid mobile number.' }, { status: 400 });

    // Save screenshot
    const screenshotsDir = path.join(process.cwd(), 'public', 'uploads', 'upi-screenshots');
    await mkdir(screenshotsDir, { recursive: true });
    const ext      = (screenshot.name.split('.').pop() ?? 'jpg').toLowerCase();
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
    await writeFile(path.join(screenshotsDir, filename), Buffer.from(await screenshot.arrayBuffer()));

    const referenceId = generateRef();

    const record: PaymentRecord = {
      referenceId,
      itemId,
      itemType,
      itemName,
      amount,
      upiId,
      txnId: txnId || '',
      screenshotUrl: `/uploads/upi-screenshots/${filename}`,
      name,
      phone,
      email,
      address,
      status:      'PENDING_VERIFICATION',
      submittedAt: new Date().toISOString(),
      verifiedAt:  null,
      adminNote:   null,
    };

    await writePaymentRecord(record);

    return NextResponse.json({ success: true, referenceId, status: 'PENDING_VERIFICATION' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[upi-payment POST]', msg);
    return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 });
  }
}

// PATCH — admin approve/reject
export async function PATCH(req: NextRequest) {
  try {
    const { referenceId, action, adminNote } = await req.json();
    if (!referenceId || !action) return NextResponse.json({ error: 'referenceId and action required' }, { status: 400 });
    if (!['approve', 'reject'].includes(action)) return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 });

    const dir  = path.join(process.cwd(), 'data', 'upi-payments');
    const file = path.join(dir, `${referenceId}.json`);
    const raw  = await readFile(file, 'utf-8');
    const record: PaymentRecord = JSON.parse(raw);

    record.status     = action === 'approve' ? 'CONFIRMED' : 'REJECTED';
    record.verifiedAt = new Date().toISOString();
    record.adminNote  = adminNote || null;

    await writeFile(file, JSON.stringify(record, null, 2));
    return NextResponse.json({ success: true, status: record.status });
  } catch {
    return NextResponse.json({ error: 'Update failed.' }, { status: 500 });
  }
}

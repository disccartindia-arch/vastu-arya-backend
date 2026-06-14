/**
 * controllers/productImageAuditController.ts (Backend)
 * ─────────────────────────────────────────────────────────────────
 * Admin controller to run the product image audit.
 * Marks products without valid images as inactive.
 * Does NOT delete any products from the database.
 *
 * Register route:
 *   POST /admin/products/audit-images  — run audit + deactivate
 *   GET  /admin/products/audit-images  — preview (dry run, no changes)
 * ─────────────────────────────────────────────────────────────────
 */

import { Request, Response } from "express";
import Product from "../models/Product";
import connectDB from "../lib/mongodb";
import { hasValidImage } from "../../frontend/utils/productImageAudit";

interface AuditResult {
  _id: string;
  name: string;
  image: string | null;
  isActive: boolean;
  action: "keep" | "deactivate";
  reason?: string;
}

async function runAudit(dryRun: boolean): Promise<{
  results: AuditResult[];
  summary: { total: number; kept: number; deactivated: number };
}> {
  await connectDB();
  const products = await Product.find({}).lean();

  const results: AuditResult[] = [];
  let kept = 0;
  let deactivated = 0;

  for (const product of products) {
    const imageField: string | null = (product as any).image ?? (product as any).images?.[0] ?? null;
    const valid = hasValidImage(imageField);

    if (!valid) {
      if (!dryRun && (product as any).isActive !== false) {
        await Product.findByIdAndUpdate(product._id, {
          $set: { isActive: false, hiddenReason: "no_image" },
        });
      }
      results.push({
        _id: String(product._id),
        name: (product as any).name ?? "Unknown",
        image: imageField,
        isActive: (product as any).isActive ?? true,
        action: "deactivate",
        reason: imageField ? `Invalid image: "${imageField}"` : "No image field",
      });
      deactivated++;
    } else {
      results.push({
        _id: String(product._id),
        name: (product as any).name ?? "Unknown",
        image: imageField,
        isActive: (product as any).isActive ?? true,
        action: "keep",
      });
      kept++;
    }
  }

  return {
    results,
    summary: { total: products.length, kept, deactivated },
  };
}

// GET — dry run preview
export async function previewImageAudit(req: Request, res: Response) {
  try {
    const { results, summary } = await runAudit(true);
    return res.json({
      dryRun: true,
      message: "Preview only — no changes made.",
      summary,
      results,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Audit preview failed: " + err.message });
  }
}

// POST — run audit and deactivate
export async function runImageAudit(req: Request, res: Response) {
  try {
    const { results, summary } = await runAudit(false);
    return res.json({
      dryRun: false,
      message: `Audit complete. ${summary.deactivated} product(s) deactivated. ${summary.kept} product(s) untouched.`,
      summary,
      results,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Audit failed: " + err.message });
  }
}

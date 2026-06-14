/**
 * app/api/products/route.ts (Frontend — Next.js App Router)
 * ─────────────────────────────────────────────────────────────────
 * Public-facing products API.
 * Automatically excludes products with missing/invalid images
 * from storefront responses.
 *
 * Admin panel should use a separate /api/admin/products route
 * that does NOT apply the image filter.
 * ─────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import { getImageFilter } from "@/utils/productImageAudit";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const page = Number(searchParams.get("page") ?? "1");
    const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 50);
    const skip = (page - 1) * limit;

    // Build query — always include image filter for storefront
    const query: Record<string, any> = {
      ...getImageFilter(),    // ← hides products with no/broken images
      isActive: { $ne: false }, // ← hides deactivated products
    };

    if (category) query.category = category;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      products,
      total,
      page,
      pages: Math.ceil(total / limit),
    });

  } catch (err: any) {
    console.error("[GET /api/products]", err);
    return NextResponse.json({ error: "Failed to fetch products." }, { status: 500 });
  }
}

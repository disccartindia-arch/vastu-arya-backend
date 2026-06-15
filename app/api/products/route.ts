/**
 * app/api/products/route.ts
 * Zero external dependencies — delegates to your existing products API
 * and filters out products with missing images in JS.
 *
 * If your project already has a working /api/products route, you can
 * DELETE this file entirely and add the image filter to your existing one.
 *
 * HOW TO USE:
 * Replace the fetchProducts() function body with your project's actual DB call.
 */

import { NextRequest, NextResponse } from "next/server";

function isValidImage(url: unknown): boolean {
  if (!url || typeof url !== "string") return false;
  const t = url.trim();
  if (!t) return false;
  if (/placeholder|no-image|noimage|undefined|null/i.test(t)) return false;
  return t.startsWith("http://") || t.startsWith("https://") || t.startsWith("/");
}

// ── Fetch products from your DB ───────────────────────────────────
// Replace this function body with your project's actual DB call.
async function fetchProducts(params: {
  category?: string;
  skip: number;
  limit: number;
}): Promise<{ products: unknown[]; total: number }> {

  // ── OPTION A: Your project has a working internal products fetch ──
  // const { connectDB } = await import("@/lib/mongodb");
  // const { default: Product } = await import("@/models/Product");
  // await connectDB();
  // const query = params.category ? { category: params.category } : {};
  // const [products, total] = await Promise.all([
  //   Product.find(query).skip(params.skip).limit(params.limit).lean(),
  //   Product.countDocuments(query),
  // ]);
  // return { products, total };

  // ── OPTION B: Fallback — call your existing API route ────────────
  // (works in dev; in production use NEXT_PUBLIC_BASE_URL)
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const qs = new URLSearchParams({
    skip:  String(params.skip),
    limit: String(params.limit),
    ...(params.category ? { category: params.category } : {}),
  });

  // Replace /api/products-all with whatever your existing products endpoint is
  const res = await fetch(`${base}/api/products-all?${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Upstream fetch failed: ${res.status}`);
  const data = await res.json();
  return { products: data.products ?? data ?? [], total: data.total ?? 0 };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") ?? undefined;
    const page     = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit    = Math.min(Number(searchParams.get("limit") ?? "20"), 50);
    const skip     = (page - 1) * limit;

    const { products: raw, total } = await fetchProducts({ category, skip, limit });

    // Filter out products with missing/broken images
    const products = (raw as any[]).filter((p) =>
      isValidImage(p.image ?? p.images?.[0]) && p.isActive !== false
    );

    return NextResponse.json({
      products,
      total,
      page,
      pages: Math.ceil(total / limit),
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[GET /api/products]", message);
    return NextResponse.json({ error: "Failed to fetch products." }, { status: 500 });
  }
}

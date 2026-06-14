/**
 * app/api/products/route.ts
 * ─────────────────────────────────────────────────────────────────
 * SELF-CONTAINED — no imports from @/lib/mongodb or @/models
 * Connects to MongoDB inline and queries the products collection
 * directly, filtering out products with missing/broken images.
 * ─────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

// ── Inline MongoDB connection ─────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI ?? process.env.DATABASE_URL ?? "";

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  if (!MONGODB_URI) throw new Error("MONGODB_URI environment variable is not set.");
  await mongoose.connect(MONGODB_URI);
  isConnected = true;
}

// ── Image validity check ──────────────────────────────────────────
function isValidImage(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const t = url.trim();
  if (t === "") return false;
  const bad = ["placeholder", "no-image", "noimage", "undefined", "null", "/images/default"];
  if (bad.some((p) => t.toLowerCase().includes(p))) return false;
  return t.startsWith("http://") || t.startsWith("https://") || t.startsWith("/");
}

// ── GET /api/products ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const page     = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit    = Math.min(Number(searchParams.get("limit") ?? "20"), 50);
    const skip     = (page - 1) * limit;

    // Build filter — hide products with no valid image and inactive products
    const query: Record<string, any> = {
      isActive: { $ne: false },
      $and: [
        { image: { $exists: true } },
        { image: { $ne: null } },
        { image: { $ne: "" } },
        { image: { $not: /placeholder|no-image|noimage|undefined/i } },
      ],
    };

    if (category) query.category = category;

    // Use raw collection access to avoid needing a model definition
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection not available.");

    // Try common collection names
    let collectionName = "products";
    const collections = await db.listCollections().toArray();
    const names = collections.map((c) => c.name);
    if (names.includes("products")) collectionName = "products";
    else if (names.includes("product")) collectionName = "product";

    const col = db.collection(collectionName);

    const [products, total] = await Promise.all([
      col.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      col.countDocuments(query),
    ]);

    // Additional client-side image filter for any edge cases
    const filtered = products.filter((p: any) => {
      const img = p.image ?? p.images?.[0];
      return isValidImage(img);
    });

    return NextResponse.json({
      products: filtered,
      total,
      page,
      pages: Math.ceil(total / limit),
    });

  } catch (err: any) {
    console.error("[GET /api/products]", err);
    return NextResponse.json({ error: "Failed to fetch products." }, { status: 500 });
  }
}

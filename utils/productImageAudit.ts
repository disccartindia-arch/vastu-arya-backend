/**
 * utils/productImageAudit.ts (Frontend + Backend shared)
 * ─────────────────────────────────────────────────────────────────
 * Utilities for filtering products with missing/broken images.
 * Products are NOT deleted — just hidden from the storefront.
 * ─────────────────────────────────────────────────────────────────
 */

/**
 * Client-side: check if a product has a valid displayable image.
 * Returns false for null, empty string, placeholder, or relative
 * paths that look broken.
 */
export function hasValidImage(imageUrl: string | null | undefined): boolean {
  if (!imageUrl) return false;
  if (typeof imageUrl !== "string") return false;
  const trimmed = imageUrl.trim();
  if (trimmed === "") return false;

  // Known placeholder/broken patterns
  const invalidPatterns = [
    "placeholder",
    "no-image",
    "noimage",
    "undefined",
    "null",
    "/images/default",
    "/images/placeholder",
  ];
  const lower = trimmed.toLowerCase();
  if (invalidPatterns.some((p) => lower.includes(p))) return false;

  // Must start with http, https, or /
  if (
    !trimmed.startsWith("http://") &&
    !trimmed.startsWith("https://") &&
    !trimmed.startsWith("/")
  ) {
    return false;
  }

  return true;
}

/**
 * Filter an array of products to only those with valid images.
 * Use on the storefront — admin panel can still see all products.
 */
export function filterProductsWithImages<T extends { image?: string | null; images?: (string | null)[] }>(
  products: T[]
): T[] {
  return products.filter((product) => {
    // Check single image field
    if (product.image !== undefined) {
      return hasValidImage(product.image);
    }
    // Check images array — need at least one valid image
    if (product.images !== undefined) {
      return product.images.some((img) => hasValidImage(img));
    }
    // No image field at all — hide from storefront
    return false;
  });
}

/**
 * Server-side MongoDB query modifier.
 * Add to any product listing query to exclude products without images.
 *
 * Usage in your API route:
 *   const products = await Product.find({
 *     ...getImageFilter(),
 *     // other filters
 *   });
 */
export function getImageFilter() {
  return {
    $and: [
      // image field exists and is not null/empty
      { image: { $exists: true } },
      { image: { $ne: null } },
      { image: { $ne: "" } },
      // not a placeholder
      { image: { $not: /placeholder|no-image|noimage|undefined/i } },
    ],
  };
}

/**
 * Backend: mark products without valid images as inactive.
 * Run this as a one-time migration or scheduled job.
 * Does NOT delete products.
 *
 * Usage in a migration script:
 *   import Product from "../models/Product";
 *   await deactivateProductsWithoutImages(Product);
 */
export async function deactivateProductsWithoutImages(ProductModel: any): Promise<{
  audited: number;
  deactivated: number;
  active: number;
}> {
  const allProducts = await ProductModel.find({}).lean();
  let deactivated = 0;
  let active = 0;

  for (const product of allProducts) {
    const imageField = product.image ?? product.images?.[0];
    const valid = hasValidImage(imageField);

    if (!valid && product.isActive !== false) {
      await ProductModel.findByIdAndUpdate(product._id, {
        $set: { isActive: false, hiddenReason: "no_image" },
      });
      deactivated++;
    } else if (valid) {
      active++;
    }
  }

  return {
    audited: allProducts.length,
    deactivated,
    active,
  };
}

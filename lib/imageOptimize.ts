/**
 * lib/imageOptimize.ts — NEW
 *
 * CHANGED this round (PRODUCTION HOTFIX ROUND 2 — Issue #7, page
 * speed / Cloudinary):
 *
 * ROOT CAUSE (see REPORT.md): product/category listing images were
 * rendered as raw <img> tags with no responsive sizing and, for
 * Cloudinary-hosted images, no delivery-time transformation params
 * (f_auto for automatic WebP/AVIF, q_auto for automatic quality,
 * w_ for a size appropriate to where the image actually renders —
 * a product CARD never needs the full 1200x1200 upload-time image).
 *
 * This helper inserts Cloudinary's standard transformation segment
 * (`f_auto,q_auto,w_{width}`) into the URL path immediately after
 * `/upload/`, which is how Cloudinary URLs are structured
 * (https://res.cloudinary.com/<cloud>/image/upload/<transforms>/<path>).
 * For any URL that is NOT a Cloudinary URL (e.g. the Unsplash seed-data
 * URLs already carrying their own ?w=&h=&fit= query params, or a
 * relative /path), this function returns the URL unchanged — it never
 * breaks a non-Cloudinary image by trying to apply a transform syntax
 * that only applies to Cloudinary's CDN.
 *
 * Used by next/image's `src`, so the already-correct next/image
 * responsive `sizes` behavior is layered on TOP of an
 * already-compressed/correctly-formatted source image, rather than
 * next/image being asked to resize a full-resolution original on every
 * request.
 */

/**
 * Returns a Cloudinary-optimized URL (auto format, auto quality,
 * capped width) when given a Cloudinary delivery URL. Any other URL
 * (Unsplash, relative path, etc.) is returned unchanged.
 */
export function optimizeImageUrl(url: string, targetWidth: number = 600): string {
  if (!url || typeof url !== 'string') return url;

  const cloudinaryMarker = '/image/upload/';
  const idx = url.indexOf(cloudinaryMarker);
  if (idx === -1) {
    // Not a Cloudinary URL — return as-is (e.g. Unsplash seed images,
    // which already carry their own w=/h=/fit= query params).
    return url;
  }

  const insertAt = idx + cloudinaryMarker.length;
  const before = url.slice(0, insertAt);
  const after  = url.slice(insertAt);

  // If a transformation segment already exists immediately after
  // /upload/ (starts with a known transform-param prefix), don't
  // double-insert — just return the URL unchanged rather than risk a
  // malformed double-transform path.
  if (/^[a-z]_/i.test(after) && after.includes(',')) {
    return url;
  }

  return `${before}f_auto,q_auto,w_${targetWidth}/${after}`;
}

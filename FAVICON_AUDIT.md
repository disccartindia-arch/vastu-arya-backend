# FAVICON_AUDIT.md — Vastu Arya

## State before update

`app/layout.tsx` (and its dead duplicate `layout.tsx` at the repo root) declared:

```ts
metadata.icons = { icon: '/logo.jpg', apple: '/logo.jpg' };
```

- Only reference to any icon anywhere is `/logo.jpg` (a **741×461 JPEG**, 268 KB).
- No `favicon.ico`, no sized PNGs, no Apple touch icon, no Android launcher icons,
  no `site.webmanifest` — so:
  - **Browser tabs / bookmarks** downscale a 741×461 rectangular JPEG to 16×16, producing a blurry, awkwardly cropped tab icon.
  - **iOS home-screen shortcuts** show a stretched / cropped image with no rounded-square treatment.
  - **Android "Add to Home Screen"** falls back to a generic Chrome-generated letter icon because no manifest is present.
  - **PWA install prompts** are entirely unavailable (no manifest → no install).
  - **Google search** may pick the JPEG as the site favicon but often ignores non-standard sizes.

## Source asset

`public/logo.jpg` — 741×461, RGB. Center-cropped square (461×461) is used as the
basis for every generated icon. The original brand logo file is **preserved
unchanged**; the new icons are derived from it.

## Assets generated (`/public/`)

| File                          | Purpose                                     | Size       |
|-------------------------------|---------------------------------------------|------------|
| `favicon.ico`                 | Multi-resolution favicon (16, 32, 48)       | 8.6 KB     |
| `favicon-16.png`              | 16×16 PNG for modern browsers               | 0.8 KB     |
| `favicon-32.png`              | 32×32 PNG for modern browsers               | 2.6 KB     |
| `apple-touch-icon.png`        | 180×180 PNG — iOS home-screen icon          | 43 KB      |
| `android-192.png`             | 192×192 PNG — Android launcher (any)        | 48 KB      |
| `android-512.png`             | 512×512 PNG — Android launcher (any)        | 280 KB     |
| `android-512-maskable.png`    | 512×512 PNG — Android launcher (maskable)   | 196 KB     |
| `site.webmanifest`            | PWA manifest referencing the above icons    | 0.6 KB     |

All PNGs are LANCZOS-resampled from the center-cropped 461×461 source and saved
optimised. The maskable variant reserves a ~10% safe area for round-mask launchers.

## Metadata changes

`app/app/layout.tsx` now declares:

```ts
export const metadata = {
  ...
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico',    sizes: 'any', type: 'image/x-icon' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/favicon.ico', color: '#FF6B00' },
    ],
  },
};
```

Old `{ icon: '/logo.jpg', apple: '/logo.jpg' }` is removed. `/logo.jpg` is still
kept in `public/` because it's used for OpenGraph / Twitter card share images
(1200×630 area) — those are correctly declared under `metadata.openGraph.images`
already, and switching them here would degrade share-preview quality.

## Coverage checklist

- [x] Chrome / Edge / Firefox tab icon (via `favicon.ico` + PNGs)
- [x] Safari macOS tab icon (via `favicon.ico`)
- [x] iOS home-screen (via `apple-touch-icon.png`)
- [x] Android launcher (via `android-192.png` / `android-512.png`)
- [x] Android launcher on round/maskable devices (`android-512-maskable.png` + manifest purpose)
- [x] PWA install banner (via `/site.webmanifest`)
- [x] Bookmarks (browsers pick the largest PNG they can render)
- [x] Next.js `metadata.icons` reflects every generated file
- [x] Every reference to `/logo.jpg` as a favicon is removed

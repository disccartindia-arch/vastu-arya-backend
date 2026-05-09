import { NextRequest, NextResponse } from 'next/server';

// URL normalization map - fixes case-sensitive DB links without RSC loops
const NORMALIZE: Record<string, string> = {
  '/vastu-store': '/vastu-store',
  '/Vastu-Store': '/vastu-store',
  '/VASTU-STORE': '/vastu-store',
  '/Book-Now': '/book-appointment',
  '/book-now': '/book-appointment',
  '/BOOK-NOW': '/book-appointment',
  '/Book': '/book-appointment',
  '/Services': '/services',
  '/About': '/about',
  '/Contact': '/contact',
  '/Blog': '/blog',
};

const PREFIX_NORMALIZE: [string, string][] = [
  ['/Vastu-Store/', '/vastu-store/'],
  ['/VASTU-STORE/', '/vastu-store/'],
  ['/Services/', '/services/'],
  ['/Blog/', '/blog/'],
];

function getCorrectPath(pathname: string): string | null {
  // Exact match
  if (NORMALIZE[pathname] && NORMALIZE[pathname] !== pathname) {
    return NORMALIZE[pathname];
  }
  // Prefix match
  for (const [wrong, correct] of PREFIX_NORMALIZE) {
    if (pathname.startsWith(wrong)) {
      return correct + pathname.slice(wrong.length);
    }
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const correctedPath = getCorrectPath(pathname);
  if (!correctedPath) return NextResponse.next();

  // Detect RSC prefetch requests (Next.js sends these with rsc= query param)
  // For RSC requests: use REWRITE (no redirect) to prevent RSC payload loops
  // For regular navigation: use REDIRECT so the URL updates in the browser
  const isRSC = searchParams.has('rsc') || request.headers.get('RSC') === '1';

  const newUrl = request.nextUrl.clone();
  newUrl.pathname = correctedPath;

  if (isRSC) {
    // Rewrite: serves correct page without changing URL — RSC safe
    return NextResponse.rewrite(newUrl);
  }

  // Redirect: changes URL in browser bar — 307 temporary (not cached)
  return NextResponse.redirect(newUrl, { status: 307 });
}

export const config = {
  matcher: [
    '/Vastu-Store',
    '/Vastu-Store/:path*',
    '/VASTU-STORE',
    '/VASTU-STORE/:path*',
    '/Book-Now',
    '/book-now',
    '/BOOK-NOW',
    '/Book',
    '/Services',
    '/Services/:path*',
    '/About',
    '/Contact',
    '/Blog',
    '/Blog/:path*',
  ],
};

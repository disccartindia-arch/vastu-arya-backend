// app/error.tsx — Fix #3a: Branded error boundary so unhandled errors never blank-screen visitors
'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center text-center px-4">
      <div className="max-w-md">
        <div className="text-5xl mb-4" aria-hidden="true">🕉️</div>
        <h1 className="font-display text-2xl font-bold text-text-dark mb-2">
          Something went wrong
        </h1>
        <p className="text-text-light mb-6">
          We&apos;re sorry — an unexpected error occurred. Please try again or return home.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            type="button"
            onClick={reset}
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:opacity-90 transition"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border border-gray-200 px-6 py-2.5 rounded-xl font-semibold text-text-mid hover:bg-gray-50 transition"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

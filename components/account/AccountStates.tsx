'use client';
/**
 * components/account/AccountStates.tsx — NEW
 *
 * PRODUCTION HOTFIX ROUND 11 — Phase D.
 *
 * Shared loading/empty/error components used identically across every
 * /account/* page, so each page doesn't reinvent its own skeleton/
 * empty-state markup — reduces duplication across 8 new pages and
 * keeps the visual language consistent automatically.
 */
import { RefreshCw, Inbox, AlertCircle } from 'lucide-react';

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-20 bg-white rounded-2xl border border-orange-100 animate-pulse" />
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, subtitle }: { icon?: any; title: string; subtitle?: string }) {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-orange-100">
      <Icon size={36} className="mx-auto mb-3 text-gray-200" />
      <p className="text-gray-600 font-medium">{title}</p>
      {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-red-100">
      <AlertCircle size={32} className="mx-auto mb-3 text-red-300" />
      <p className="text-gray-600 font-medium">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 inline-flex items-center gap-2 px-4 py-2 border border-orange-200 rounded-xl text-sm font-medium text-primary hover:bg-orange-50">
          <RefreshCw size={14} /> Try Again
        </button>
      )}
    </div>
  );
}

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-5">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40">Previous</button>
      <span className="text-sm text-gray-500">Page {page} of {pages}</span>
      <button disabled={page >= pages} onClick={() => onChange(page + 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40">Next</button>
    </div>
  );
}

'use client';
import { formatPrice, calculateDiscount } from '../../lib/utils';

interface PriceDisplayProps { original: number; offer: number; size?: 'sm' | 'md' | 'lg'; showBadge?: boolean; }

export default function PriceDisplay({ original, offer, size = 'md', showBadge = true }: PriceDisplayProps) {
  const discount = calculateDiscount(original, offer);
  const sizes = { sm: { offer: 'text-lg', orig: 'text-sm', badge: 'text-xs px-1.5 py-0.5' }, md: { offer: 'text-2xl', orig: 'text-sm', badge: 'text-xs px-2 py-1' }, lg: { offer: 'text-4xl', orig: 'text-base', badge: 'text-sm px-2.5 py-1' } };
  const s = sizes[size];
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={`font-bold text-primary font-display ${s.offer}`}>{formatPrice(offer)}</span>
      {original > offer && <span className={`price-cut ${s.orig}`}>{formatPrice(original)}</span>}
      {showBadge && discount > 0 && <span className={`bg-green-100 text-green-700 font-bold rounded-lg ${s.badge}`}>{discount}% OFF</span>}
    </div>
  );
}

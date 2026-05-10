'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { settingsAPI } from '../../lib/api';

interface PopupData {
  _id: string;
  title: string;
  content: string;
  image?: string;
  ctaText: string;
  ctaLink: string;
  delay: number;
  isActive: boolean;
  type: string;
}

const SESSION_KEY = 'va_popup_seen';

export default function SitePopup() {
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show on admin pages
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) return;

    // Don't re-show in the same browser session
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {}

    settingsAPI.getPopups({ isActive: true })
      .then(r => {
        const all: PopupData[] = r?.data?.data || [];
        // Pick the first active popup, sorted by however the backend returns them
        const active = all.find(p => p.isActive);
        if (!active) return;

        const delayMs = Math.max(0, (active.delay || 3)) * 1000;
        const timer = setTimeout(() => {
          setPopup(active);
          // Small tick to allow CSS transition to trigger
          requestAnimationFrame(() => setVisible(true));
        }, delayMs);

        return () => clearTimeout(timer);
      })
      .catch(() => {});
  }, []);

  const close = () => {
    setVisible(false);
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch {}
    // Remove from DOM after transition
    setTimeout(() => setPopup(null), 350);
  };

  if (!popup) return null;

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4"
      style={{
        background: visible ? 'rgba(0,0,0,0.65)' : 'transparent',
        backdropFilter: visible ? 'blur(4px)' : 'none',
        transition: 'background 0.3s, backdrop-filter 0.3s',
        pointerEvents: visible ? 'auto' : 'none',
      }}
      onClick={close}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full overflow-hidden"
        style={{
          maxWidth: '440px',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s',
          border: '1px solid rgba(212,160,23,0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={close}
          aria-label="Close popup"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{ background: 'rgba(0,0,0,0.35)', color: 'white' }}
        >
          <X size={16} />
        </button>

        {/* Image */}
        {popup.image && (
          <div className="w-full" style={{ maxHeight: '220px', overflow: 'hidden' }}>
            <img
              src={popup.image}
              alt={popup.title}
              className="w-full object-cover"
              style={{ maxHeight: '220px' }}
              loading="eager"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6 text-center">
          {popup.title && (
            <h2 className="font-display text-xl sm:text-2xl font-bold text-gray-800 mb-2 leading-tight">
              {popup.title}
            </h2>
          )}
          {popup.content && (
            <p className="text-gray-500 text-sm leading-relaxed mb-5">
              {popup.content}
            </p>
          )}
          {popup.ctaText && popup.ctaLink && (
            <Link
              href={popup.ctaLink}
              onClick={close}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)', boxShadow: '0 4px 20px rgba(255,107,0,0.35)' }}
            >
              {popup.ctaText}
            </Link>
          )}
          <button
            onClick={close}
            className="block mx-auto mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            No thanks, close
          </button>
        </div>
      </div>
    </div>
  );
}

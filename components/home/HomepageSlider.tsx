'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { settingsAPI } from '../../lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  _id: string;
  title: string;
  subtitle: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  isActive: boolean;
  sortOrder: number;
}

export default function HomepageSlider() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    settingsAPI.getSliders()
      .then(r => {
        const all: Slide[] = r?.data?.data || [];
        const active = all
          .filter(s => s.isActive && s.image)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        setSlides(active);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const next = useCallback(() => setCurrent(c => (c + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + slides.length) % slides.length), [slides.length]);

  // Autoplay
  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(next, 4500);
    return () => clearInterval(t);
  }, [slides.length, next]);

  // Don't render anything while loading or if no active slides exist
  if (!loaded || slides.length === 0) return null;

  const slide = slides[current];

  return (
    <section className="relative w-full overflow-hidden bg-gray-900" style={{ height: 'clamp(240px, 40vw, 480px)' }}>
      {/* Slides */}
      {slides.map((s, i) => (
        <div
          key={s._id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
        >
          <img
            src={s.image}
            alt={s.title || 'Vastu Arya'}
            className="w-full h-full object-cover"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
          {/* Dark overlay */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.1) 100%)' }}/>
        </div>
      ))}

      {/* Content overlay - always current slide */}
      <div className="absolute inset-0 z-10 flex items-center">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="max-w-xl">
            {slide.title && (
              <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight drop-shadow-lg">
                {slide.title}
              </h2>
            )}
            {slide.subtitle && (
              <p className="text-white/85 text-sm sm:text-lg mb-6 leading-relaxed drop-shadow">
                {slide.subtitle}
              </p>
            )}
            {slide.ctaText && slide.ctaLink && (
              <Link
                href={slide.ctaLink}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm sm:text-base text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#FF6B00,#FF9933)', boxShadow: '0 4px 20px rgba(255,107,0,0.4)' }}
              >
                {slide.ctaText}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Navigation arrows — only if multiple slides */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)' }}
          >
            <ChevronRight size={20} className="text-white" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="rounded-full transition-all"
                style={{
                  height: '6px',
                  width: i === current ? '24px' : '6px',
                  background: i === current ? '#FF6B00' : 'rgba(255,255,255,0.5)',
                }}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

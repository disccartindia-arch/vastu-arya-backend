// components/ui/LuxuryBackground.tsx — Fix #8: Skip on admin + respect prefers-reduced-motion
'use client';
import { useEffect, useRef } from 'react';

export default function LuxuryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Fix #8a — Skip animation on admin routes (saves CPU for content editors)
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      return;
    }

    // Fix #8b — Respect OS-level "reduce motion" accessibility preference
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    interface Particle {
      x: number; y: number; r: number;
      vx: number; vy: number;
      alpha: number; va: number;
      gold: boolean;
    }

    const particles: Particle[] = [];
    const STAR_COUNT = 80;
    const PARTICLE_COUNT = 40;

    // Create stars
    for (let i = 0; i < STAR_COUNT; i++) {
      particles.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.5 + 0.3,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        alpha: Math.random() * 0.6 + 0.2,
        va: (Math.random() - 0.5) * 0.008,
        gold: Math.random() > 0.5,
      });
    }

    // Create larger gold particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 3 + 1,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -Math.random() * 0.3 - 0.05,
        alpha: Math.random() * 0.4 + 0.1,
        va: (Math.random() - 0.5) * 0.005,
        gold: true,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Subtle radial glow
      const grd = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.7);
      grd.addColorStop(0, 'rgba(212,160,23,0.025)');
      grd.addColorStop(1, 'rgba(212,160,23,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.va;

        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        if (p.alpha <= 0.05) p.va = Math.abs(p.va);
        if (p.alpha >= 0.85) p.va = -Math.abs(p.va);

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

        if (p.gold) {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
          grad.addColorStop(0, 'rgba(212,160,23,0.8)');
          grad.addColorStop(0.4, 'rgba(240,192,64,0.4)');
          grad.addColorStop(1, 'rgba(212,160,23,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#F0C040';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(255,248,230,0.9)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    const onResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="luxury-canvas"
      aria-hidden="true"  // Fix #8 — screen readers skip decorative canvas
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.65,
      }}
    />
  );
}

'use client';

import { useEffect, useRef } from 'react';

export function MeshBackground({ density = 0.00009, className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const mq = (q) => window.matchMedia?.(q).matches;
    const reduce =
      typeof window !== 'undefined' &&
      (mq('(prefers-reduced-motion: reduce)') ||
        mq('(pointer: coarse)') ||
        window.innerWidth < 768);

    let width = 0;
    let height = 0;
    let nodes = [];
    let raf = 0;
    let running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pointer = { x: -9999, y: -9999 };

    const readColors = () => {
      const styles = getComputedStyle(document.documentElement);
      const violet = styles.getPropertyValue('--brand-violet').trim() || '252 100% 72%';
      const cyan = styles.getPropertyValue('--brand-cyan').trim() || '187 92% 58%';
      return { violet, cyan };
    };
    let colors = readColors();

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(70, Math.max(24, Math.floor(width * height * density)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.4 + 0.8,
        warm: Math.random() > 0.55,
      }));
    };

    const LINK = 150;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j += 1) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK) {
            const alpha = (1 - dist / LINK) * 0.18;
            ctx.strokeStyle = `hsl(${a.warm ? colors.violet : colors.cyan} / ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        const pdx = n.x - pointer.x;
        const pdy = n.y - pointer.y;
        const near = Math.hypot(pdx, pdy) < 120;
        const hsl = n.warm ? colors.violet : colors.cyan;
        ctx.beginPath();
        ctx.arc(n.x, n.y, near ? n.r * 1.8 : n.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${hsl} / ${near ? 0.85 : 0.5})`;
        ctx.fill();
      }
    };

    const step = () => {
      if (!running) return;
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        const dx = pointer.x - n.x;
        const dy = pointer.y - n.y;
        const d = Math.hypot(dx, dy);
        if (d < 160 && d > 0.01) {
          n.x += (dx / d) * 0.25;
          n.y += (dy / d) * 0.25;
        }
      }
      draw();
      raf = requestAnimationFrame(step);
    };

    const onResize = () => {
      colors = readColors();
      build();
      draw();
    };
    const onMove = (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };
    const onVisibility = () => {
      running = !document.hidden;
      if (running && !reduce) {
        raf = requestAnimationFrame(step);
      } else {
        cancelAnimationFrame(raf);
      }
    };

    build();
    if (reduce) {
      draw();
    } else {
      raf = requestAnimationFrame(step);
      window.addEventListener('mousemove', onMove, { passive: true });
      window.addEventListener('mouseleave', onLeave);
      document.addEventListener('visibilitychange', onVisibility);
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 -z-[8] h-full w-full opacity-70 ${className}`}
    />
  );
}

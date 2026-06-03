'use client';

import { useEffect, useState } from 'react';

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    const compute = () => {
      ticking = false;
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(compute);
      }
    };
    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-0.5">
      <div
        className="h-full bg-gradient-to-r from-brand-violet to-brand-cyan shadow-[0_0_12px_hsl(var(--brand-violet)/0.7)] transition-[width] duration-75"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-label="Reading progress"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

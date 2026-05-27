'use client';

import { useEffect, useState } from 'react';

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') || 'section';

export function useToc(containerRef, contentKey) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root || contentKey == null) {
      setHeadings([]);
      setActiveId(null);
      return undefined;
    }
    const raf = requestAnimationFrame(() => {
      const els = [...root.querySelectorAll('h1, h2, h3, h4')];
      const seen = new Map();
      const items = els.map((el) => {
        if (!el.id) {
          const base = slugify(el.textContent || 'section');
          const n = seen.get(base) ?? 0;
          seen.set(base, n + 1);
          el.id = n ? `${base}-${n}` : base;
        }
        return { id: el.id, text: el.textContent || '', depth: Number(el.tagName[1]) };
      });
      setHeadings(items);
    });
    return () => cancelAnimationFrame(raf);
  }, [containerRef, contentKey]);

  useEffect(() => {
    if (headings.length === 0) {
      setActiveId(null);
      return undefined;
    }
    let ticking = false;
    const compute = () => {
      ticking = false;
      let current = headings[0].id;
      for (const { id } of headings) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top - 96 <= 0) current = id;
        else break;
      }
      setActiveId(current);
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
  }, [headings]);

  return { headings, activeId };
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { applyHighlights, clearHighlights } from '@/lib/markdown/highlight';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

const ACTIVE_CLASS = 'rm-hl-active';
const MIN_QUERY_LENGTH = 2;

export function useDocSearch(containerRef, contentKey) {
  const [query, setQuery] = useState('');
  const [count, setCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const marksRef = useRef([]);
  const debouncedQuery = useDebouncedValue(query, 150);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;
    const term = debouncedQuery.trim();

    const raf = requestAnimationFrame(() => {
      const marks = term.length >= MIN_QUERY_LENGTH ? applyHighlights(root, term) : [];
      if (term.length < MIN_QUERY_LENGTH) clearHighlights(root);
      marksRef.current = marks;
      setCount(marks.length);
      setActiveIndex(marks.length ? 0 : -1);
    });

    return () => cancelAnimationFrame(raf);
  }, [containerRef, debouncedQuery, contentKey]);

  useEffect(() => {
    const root = containerRef.current;
    return () => clearHighlights(root);
  }, [containerRef]);


  useEffect(() => {
    const marks = marksRef.current;
    marks.forEach((mark, index) => mark.classList.toggle(ACTIVE_CLASS, index === activeIndex));

    const target = marks[activeIndex];
    if (!target) return;

    let ancestor = target.parentElement;
    while (ancestor) {
      if (ancestor.classList?.contains('md-section-body') && ancestor.hidden) {
        ancestor.hidden = false;
      }
      ancestor = ancestor.parentElement;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeIndex, count]);

  const next = useCallback(() => {
    setActiveIndex((index) => (count === 0 ? -1 : (index + 1) % count));
  }, [count]);

  const prev = useCallback(() => {
    setActiveIndex((index) => (count === 0 ? -1 : (index - 1 + count) % count));
  }, [count]);

  const clear = useCallback(() => setQuery(''), []);

  return { query, setQuery, count, activeIndex, next, prev, clear };
}

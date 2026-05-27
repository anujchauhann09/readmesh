'use client';

import { cn } from '@/lib/utils';

export function Toc({ headings, activeId, onNavigate }) {
  if (!headings || headings.length === 0) return null;

  const go = (event, id) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    onNavigate?.();
  };

  return (
    <nav aria-label="Table of contents" className="text-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        On this page
      </p>
      <ul className="border-l border-border">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: `${(h.depth - 1) * 0.75}rem` }}>
            <a
              href={`#${h.id}`}
              onClick={(e) => go(e, h.id)}
              className={cn(
                '-ml-px block border-l-2 py-1 pl-3 transition-colors',
                activeId === h.id
                  ? 'border-primary font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

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
      <p className="mb-3 flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <span className="rm-node-dot" aria-hidden /> On this page
      </p>
      <ul className="border-l border-border/70">
        {headings.map((h) => {
          const active = activeId === h.id;
          return (
            <li key={h.id} style={{ paddingLeft: `${(h.depth - 1) * 0.75}rem` }}>
              <a
                href={`#${h.id}`}
                onClick={(e) => go(e, h.id)}
                className={cn(
                  '-ml-px flex items-center gap-2 border-l-2 py-1 pl-3 transition-all',
                  active
                    ? 'border-brand-violet font-medium text-foreground'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 shrink-0 rounded-full transition-all',
                    active
                      ? 'bg-brand-violet shadow-[0_0_8px_hsl(var(--brand-violet))]'
                      : 'bg-transparent',
                  )}
                  aria-hidden
                />
                <span className="truncate">{h.text}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

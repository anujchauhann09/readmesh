'use client';

import { Fragment } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Breadcrumb({ repo, path, onRoot }) {
  const segments = (path || '').split('/').filter(Boolean);

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted-foreground"
    >
      <button
        type="button"
        onClick={onRoot}
        className="shrink-0 font-medium hover:text-foreground"
      >
        {repo}
      </button>
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        return (
          <Fragment key={`${segment}-${index}`}>
            <ChevronRight className="h-3 w-3 shrink-0 opacity-60" />
            <span className={cn('truncate', isLast && 'font-medium text-foreground')}>
              {segment}
            </span>
          </Fragment>
        );
      })}
    </nav>
  );
}

'use client';

import { Fragment } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * repo / docs / guides / setup.md
 *
 * Directory segments are actionable — they reveal that folder in the file list —
 * while the trailing filename is the current page and stays inert. Previously only
 * the repo root did anything, so the trail read as navigation but was decoration.
 */
export function Breadcrumb({ repo, path, onRoot, onOpenDir }) {
  const segments = (path || '').split('/').filter(Boolean);

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted-foreground"
    >
      <button type="button" onClick={onRoot} className="shrink-0 font-medium hover:text-foreground">
        {repo}
      </button>
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const dirPath = segments.slice(0, index + 1).join('/');

        return (
          <Fragment key={`${segment}-${index}`}>
            <ChevronRight className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
            {isLast ? (
              <span className="truncate font-medium text-foreground" aria-current="page">
                {segment}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onOpenDir?.(dirPath)}
                title={`Show ${dirPath}/ in the file list`}
                className={cn('truncate rounded px-0.5 hover:text-foreground hover:underline')}
              >
                {segment}
              </button>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}

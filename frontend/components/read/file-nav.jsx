'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const dirId = (dir) => `filenav-dir-${(dir || 'root').replace(/[^\w-]/g, '_')}`;

export function FileNav({ files = [], activePath, truncated, onOpen, revealDir }) {
  const rootRef = useRef(null);

  const groups = [];
  const byDir = new Map();
  for (const f of files) {
    const dir = f.dir || '';
    if (!byDir.has(dir)) {
      byDir.set(dir, []);
      groups.push(dir);
    }
    byDir.get(dir).push(f);
  }

  // Scrolls to the folder the breadcrumb points at. `revealDir` carries a nonce so
  // clicking the same crumb twice still scrolls.
  useEffect(() => {
    if (!revealDir?.dir) return;
    rootRef.current
      ?.querySelector(`#${CSS.escape(dirId(revealDir.dir))}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [revealDir]);

  return (
    <nav aria-label="Repository files" className="text-sm" ref={rootRef}>
      <p className="mb-3 flex items-center gap-2 px-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <span className="rm-node-dot" aria-hidden /> Files ({files.length}
        {truncated ? '+' : ''})
      </p>
      <div className="space-y-3">
        {groups.map((dir) => (
          <div key={dir || '/'} id={dirId(dir)}>
            {dir && (
              <p className="truncate px-2 py-1 text-xs text-muted-foreground/70" title={dir}>
                {dir}/
              </p>
            )}
            <ul>
              {byDir.get(dir).map((f) => (
                <li key={f.path}>
                  <button
                    type="button"
                    onClick={() => onOpen(f.path)}
                    title={f.path}
                    aria-current={activePath === f.path ? 'page' : undefined}
                    className={cn(
                      'w-full truncate rounded-md border-l-2 px-2 py-1 text-left transition-colors hover:bg-accent',
                      activePath === f.path
                        ? 'border-brand-violet bg-accent font-medium text-foreground'
                        : 'border-transparent text-muted-foreground',
                    )}
                  >
                    {f.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

'use client';

import { cn } from '@/lib/utils';

export function FileNav({ files = [], activePath, truncated, onOpen }) {
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

  return (
    <nav aria-label="Repository files" className="text-sm">
      <p className="mb-3 flex items-center gap-2 px-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <span className="rm-node-dot" aria-hidden /> Files ({files.length}
        {truncated ? '+' : ''})
      </p>
      <div className="space-y-3">
        {groups.map((dir) => (
          <div key={dir || '/'}>
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

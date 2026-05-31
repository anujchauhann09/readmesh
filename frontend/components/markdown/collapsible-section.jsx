'use client';

import { Children, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CollapsibleSection({ depth, children }) {
  const [open, setOpen] = useState(true);
  const items = Children.toArray(children);
  const heading = items[0];
  const body = items.slice(1);
  const hasBody = body.length > 0;

  return (
    <section className={cn('md-section', `md-section--h${depth}`)} data-collapsed={!open}>
      <div className="md-section-heading">
        {hasBody ? (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? 'Collapse section' : 'Expand section'}
            className="md-section-toggle"
          >
            <ChevronRight className={cn('h-4 w-4 transition-transform', open && 'rotate-90')} />
          </button>
        ) : (
          <span className="md-section-toggle" aria-hidden="true" />
        )}
        {heading}
      </div>
      <div className="md-section-body" hidden={!open}>
        {body}
      </div>
    </section>
  );
}

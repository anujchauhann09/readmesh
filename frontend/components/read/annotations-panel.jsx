'use client';

import { Highlighter, Link2, MessageSquare, StickyNote, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_META = {
  HIGHLIGHT: { icon: Highlighter, label: 'Highlight' },
  NOTE: { icon: StickyNote, label: 'Note' },
  COMMENT: { icon: MessageSquare, label: 'Comment' },
};

export function AnnotationsPanel({ annotations, onClose, onJump, onCopyLink, onDelete }) {
  const sorted = [...annotations].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-semibold">Notes &amp; Highlights ({annotations.length})</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close annotations"
          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        {sorted.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-muted-foreground">
            Select text in the document to highlight it, add a note, or comment on a section.
          </p>
        ) : (
          <ul className="space-y-2">
            {sorted.map((a) => (
              <AnnotationItem
                key={a.id}
                annotation={a}
                onJump={() => onJump(a)}
                onCopyLink={() => onCopyLink(a)}
                onDelete={() => onDelete(a)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AnnotationItem({ annotation, onJump, onCopyLink, onDelete }) {
  const meta = TYPE_META[annotation.type] ?? TYPE_META.NOTE;
  const Icon = meta.icon;

  return (
    <li className="rounded-md border border-border">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-2 py-1">
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <Icon className="h-3.5 w-3.5" /> {meta.label}
        </span>
        <div className="flex items-center gap-0.5">
          <IconButton label="Copy link" onClick={onCopyLink}>
            <Link2 className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton label="Delete" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>

      <button type="button" onClick={onJump} className="block w-full px-2 py-2 text-left">
        {annotation.exact && (
          <p
            className={cn(
              'line-clamp-2 border-l-2 border-border pl-2 text-xs italic text-muted-foreground',
              annotation.type === 'HIGHLIGHT' && 'not-italic',
            )}
          >
            “{annotation.exact}”
          </p>
        )}
        {annotation.body && <p className="mt-1 text-sm">{annotation.body}</p>}
        {annotation.sectionTitle && (
          <p className="mt-1 truncate text-[11px] text-muted-foreground">
            § {annotation.sectionTitle}
          </p>
        )}
      </button>
    </li>
  );
}

function IconButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {children}
    </button>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { Highlighter, MessageSquare, MessageSquarePlus, StickyNote, Trash2, X } from 'lucide-react';
import { HIGHLIGHT_COLORS } from '@readmesh/shared';
import { useDialog } from '@/providers/dialog-provider';
import {
  renderAnnotations,
  clearAnnotations,
  serializeRange,
  sectionForRange,
} from '@/lib/markdown/anchor';
import { cn } from '@/lib/utils';

const COLOR_SWATCH = {
  yellow: 'bg-yellow-300',
  green: 'bg-green-300',
  blue: 'bg-blue-300',
  pink: 'bg-pink-300',
  purple: 'bg-purple-300',
};

const TYPE_ICON = { HIGHLIGHT: Highlighter, NOTE: StickyNote, COMMENT: MessageSquare };
const TYPE_LABEL = { HIGHLIGHT: 'Highlight', NOTE: 'Note', COMMENT: 'Comment' };

export function AnnotationLayer({ contentRef, contentKey, doc, annotations, onCreate, onDelete }) {
  const dialog = useDialog();
  const [toolbar, setToolbar] = useState(null); 
  const [popover, setPopover] = useState(null); 
  const pendingRef = useRef(null);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return undefined;
    const raf = requestAnimationFrame(() => renderAnnotations(root, annotations));
    return () => cancelAnimationFrame(raf);
  }, [contentRef, contentKey, annotations]);

  useEffect(() => {
    const root = contentRef.current;
    return () => clearAnnotations(root);
  }, [contentRef]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return undefined;

    const onMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setToolbar(null);
        return;
      }
      const range = selection.getRangeAt(0);
      if (!root.contains(range.commonAncestorContainer) || !range.toString().trim()) {
        setToolbar(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      pendingRef.current = range.cloneRange();
      setPopover(null);
      setToolbar({ top: rect.top - 44, left: rect.left + rect.width / 2 });
    };

    document.addEventListener('mouseup', onMouseUp);
    return () => document.removeEventListener('mouseup', onMouseUp);
  }, [contentRef]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return undefined;

    const onClick = (event) => {
      const mark = event.target.closest?.('mark[data-annot-id]');
      const selection = window.getSelection();
      if (!mark || (selection && !selection.isCollapsed)) {
        setPopover(null);
        return;
      }
      const rect = mark.getBoundingClientRect();
      setPopover({
        id: mark.getAttribute('data-annot-id'),
        top: rect.bottom + 6,
        left: rect.left + rect.width / 2,
      });
    };

    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [contentRef]);

  useEffect(() => {
    if (!popover) return undefined;
    const close = () => setPopover(null);
    window.addEventListener('scroll', close, { passive: true });
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close);
      window.removeEventListener('resize', close);
    };
  }, [popover]);

  const buildAnchor = () => {
    const root = contentRef.current;
    const range = pendingRef.current;
    if (!root || !range) return null;
    const anchor = serializeRange(root, range);
    if (!anchor) return null;
    return { ...anchor, ...sectionForRange(root, range), ...doc };
  };

  const dismiss = () => {
    setToolbar(null);
    pendingRef.current = null;
    window.getSelection()?.removeAllRanges();
  };

  const addHighlight = (color) => {
    const anchor = buildAnchor();
    if (anchor) onCreate({ type: 'HIGHLIGHT', color, ...anchor });
    dismiss();
  };

  const addNote = async () => {
    const anchor = buildAnchor();
    setToolbar(null);
    if (!anchor) return;
    const result = await dialog.prompt({
      title: 'Add note',
      submitLabel: 'Save',
      fields: [{ name: 'body', label: 'Note', placeholder: 'Your note…', required: true }],
    });
    if (result?.body) onCreate({ type: 'NOTE', color: 'yellow', body: result.body, ...anchor });
    dismiss();
  };

  const addComment = async () => {
    const anchor = buildAnchor();
    setToolbar(null);
    if (!anchor) return;
    const result = await dialog.prompt({
      title: anchor.sectionTitle ? `Comment on “${anchor.sectionTitle}”` : 'Add comment',
      submitLabel: 'Save',
      fields: [{ name: 'body', label: 'Comment', placeholder: 'Your comment…', required: true }],
    });
    if (result?.body) onCreate({ type: 'COMMENT', body: result.body, ...anchor });
    dismiss();
  };

  const activeAnnotation = popover && annotations.find((a) => a.id === popover.id);

  return (
    <>
      {toolbar && (
        <div
          className="fixed z-50 -translate-x-1/2"
          style={{ top: Math.max(8, toolbar.top), left: toolbar.left }}
          onMouseDown={(e) => e.preventDefault()} 
        >
          <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-popover/90 p-1 shadow-2xl backdrop-blur-xl rm-modal-in">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => addHighlight(color)}
                aria-label={`Highlight ${color}`}
                title={`Highlight ${color}`}
                className={cn('h-5 w-5 rounded-full border border-black/10', COLOR_SWATCH[color])}
              />
            ))}
            <span className="mx-0.5 h-5 w-px bg-border" />
            <button
              type="button"
              onClick={addNote}
              title="Add note"
              aria-label="Add note"
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <StickyNote className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={addComment}
              title="Comment on section"
              aria-label="Comment on section"
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <MessageSquarePlus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {activeAnnotation && (
        <MarkPopover
          annotation={activeAnnotation}
          top={popover.top}
          left={popover.left}
          onClose={() => setPopover(null)}
          onDelete={() => {
            onDelete?.(activeAnnotation);
            setPopover(null);
          }}
        />
      )}
    </>
  );
}

function MarkPopover({ annotation, top, left, onClose, onDelete }) {
  const Icon = TYPE_ICON[annotation.type] ?? StickyNote;
  return (
    <div
      className="fixed z-50 w-72 max-w-[calc(100vw-1rem)] -translate-x-1/2 rounded-xl border border-border/80 bg-popover/90 p-3 text-popover-foreground shadow-2xl backdrop-blur-xl rm-modal-in"
      style={{ top: Math.min(top, window.innerHeight - 160), left }}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <Icon className="h-3.5 w-3.5" /> {TYPE_LABEL[annotation.type] ?? 'Note'}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete"
            title="Delete"
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            title="Close"
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {annotation.body ? (
        <p className="whitespace-pre-wrap text-sm">{annotation.body}</p>
      ) : (
        <p className="text-sm italic text-muted-foreground">Highlight</p>
      )}

      {annotation.exact && (
        <p className="mt-2 line-clamp-3 border-l-2 border-border pl-2 text-xs text-muted-foreground">
          “{annotation.exact}”
        </p>
      )}
    </div>
  );
}

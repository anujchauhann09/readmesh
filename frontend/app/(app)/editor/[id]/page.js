'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Check, ChevronDown, FileText, Plus, Trash2 } from 'lucide-react';
import { MarkdownEditor } from '@/components/editor/markdown-editor';
import { Markdown } from '@/components/markdown/markdown';
import { ExportMenu } from '@/components/export/export-menu';
import { ThemeMenu } from '@/components/read/theme-menu';
import { DocSearch } from '@/components/read/doc-search';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { deriveDocumentTitle } from '@readmesh/shared';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useDocSearch } from '@/hooks/use-doc-search';
import { useDocuments, useDocumentAutosave } from '@/hooks/use-documents';
import { useDialog } from '@/providers/dialog-provider';
import { cn } from '@/lib/utils';

const STATUS = {
  idle: { label: 'Saved', tone: 'text-muted-foreground', dot: 'bg-brand-cyan' },
  saving: { label: 'Saving…', tone: 'text-muted-foreground', dot: 'bg-amber-400 animate-pulse' },
  saved: { label: 'Saved', tone: 'text-muted-foreground', dot: 'bg-brand-cyan' },
  error: { label: 'Save failed', tone: 'text-destructive', dot: 'bg-destructive' },
};

export default function EditorDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const dialog = useDialog();

  const { documents, create, remove, hasMore, loadMore, isLoadingMore } = useDocuments();
  const { document: doc, isLoading, isError, status, save } = useDocumentAutosave(id);

  const [source, setSource] = useState(null);
  const [mobileView, setMobileView] = useState('edit');
  const previewRef = useRef(null);

  // Seed the editor when the loaded document changes (not on every autosave).
  useEffect(() => {
    if (doc) setSource(doc.content ?? '');
  }, [doc?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const preview = useDebouncedValue(source ?? '', 150);
  const search = useDocSearch(previewRef, preview);
  // The same helper the server titles the saved document with.
  const title = useMemo(() => deriveDocumentTitle(source ?? ''), [source]);

  const onChange = (val) => {
    setSource(val);
    save(val);
  };

  const newDocument = () =>
    create.mutate(
      { content: '# Untitled\n\n' },
      { onSuccess: (d) => router.push(`/editor/${d.id}`) },
    );

  const deleteDocument = async () => {
    const ok = await dialog.confirm({
      title: 'Delete this document?',
      description: 'This permanently removes it from your saved documents.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    remove.mutate(id, {
      onSuccess: () => {
        const next = documents.find((d) => d.id !== id);
        router.push(next ? `/editor/${next.id}` : '/editor');
      },
    });
  };

  if (isError) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <div className="rm-panel rm-rise p-8">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <h1 className="mt-4 font-display text-xl font-semibold">Document not found</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            It may have been deleted, or it isn&apos;t yours.
          </p>
          <Link
            href="/editor"
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Back to editor
          </Link>
        </div>
      </main>
    );
  }

  const st = STATUS[status] ?? STATUS.idle;

  return (
    <main className="mx-auto max-w-[88rem] px-4 py-7 lg:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* Document switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex max-w-[16rem] items-center gap-2 rounded-lg border border-border/70 bg-card/40 px-3 py-2 text-sm outline-none backdrop-blur-sm transition-colors hover:border-brand-violet/40 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40">
              <FileText className="h-4 w-4 shrink-0 text-brand-violet" />
              <span className="truncate font-medium">{title}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-80 w-72 overflow-auto">
              {documents.map((d) => (
                <DropdownMenuItem
                  key={d.id}
                  onSelect={() => router.push(`/editor/${d.id}`)}
                  className="justify-between gap-3"
                >
                  <span className="truncate">{d.title}</span>
                  {d.id === id && <Check className="h-3.5 w-3.5 shrink-0 text-brand-violet" />}
                </DropdownMenuItem>
              ))}
              {/* Collections are paged, so the switcher offers the rest rather
                  than pretending the first page is everything. */}
              {hasMore && (
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    loadMore();
                  }}
                  className="justify-center text-xs text-muted-foreground"
                >
                  {isLoadingMore ? 'Loading…' : 'Load more documents'}
                </DropdownMenuItem>
              )}
              {documents.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem onSelect={newDocument} className="text-brand-violet">
                <Plus className="mr-2 h-4 w-4" /> New document
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Autosave status */}
          <span className={cn('hidden items-center gap-1.5 text-xs sm:inline-flex', st.tone)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
            {st.label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border/70 bg-card/40 p-0.5 text-xs backdrop-blur-sm lg:hidden">
            <button
              type="button"
              onClick={() => setMobileView('edit')}
              className={mobileView === 'edit' ? 'rounded-md bg-accent px-2.5 py-1 font-medium' : 'px-2.5 py-1 text-muted-foreground'}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setMobileView('preview')}
              className={mobileView === 'preview' ? 'rounded-md bg-accent px-2.5 py-1 font-medium' : 'px-2.5 py-1 text-muted-foreground'}
            >
              Preview
            </button>
          </div>
          <button
            type="button"
            onClick={newDocument}
            title="New document"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/40 px-2.5 py-2 text-sm backdrop-blur-sm transition-colors hover:border-brand-violet/40 hover:bg-accent"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
          </button>
          <ThemeMenu />
          <ExportMenu
            getMarkdown={() => source ?? ''}
            getRenderedEl={() => previewRef.current}
            title={title}
            disabled={source == null}
          />
          <button
            type="button"
            onClick={deleteDocument}
            title="Delete document"
            aria-label="Delete document"
            className="inline-flex items-center justify-center rounded-lg border border-border/70 bg-card/40 p-2 text-muted-foreground backdrop-blur-sm transition-colors hover:border-destructive/50 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading || source == null ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rm-skeleton h-[72vh]" />
          <div className="rm-skeleton hidden h-[72vh] lg:block" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <MarkdownEditor
            value={source}
            onChange={onChange}
            minHeight="0"
            className={cn(
              'h-[72vh] w-full overflow-hidden rm-panel',
              mobileView === 'preview' && 'hidden lg:flex',
            )}
          />
          <div
            className={cn(
              'rm-panel flex h-[72vh] flex-col',
              mobileView === 'edit' && 'hidden lg:flex',
            )}
          >
            <div className="flex items-center border-b border-border/70 p-2">
              <DocSearch
                query={search.query}
                onQueryChange={search.setQuery}
                count={search.count}
                activeIndex={search.activeIndex}
                onNext={search.next}
                onPrev={search.prev}
                onClear={search.clear}
              />
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4 lg:p-6" ref={previewRef}>
              <Markdown content={preview} collapsibleSections />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

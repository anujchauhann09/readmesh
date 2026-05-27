'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ListTree, Menu, RotateCcw, X } from 'lucide-react';
import { loadRepoRequest, getContentRequest } from '@/lib/api/github';
import { Markdown } from '@/components/markdown/markdown';
import { MarkdownEditor } from '@/components/editor/markdown-editor';
import { ReadingProgress } from '@/components/read/reading-progress';
import { FileNav } from '@/components/read/file-nav';
import { Toc } from '@/components/read/toc';
import { ThemeMenu } from '@/components/read/theme-menu';
import { ExportMenu } from '@/components/export/export-menu';
import { useToc } from '@/hooks/use-toc';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function ReadPage() {
  const [url, setUrl] = useState('');
  const [active, setActive] = useState(null); 
  const [draft, setDraft] = useState(''); 
  const [view, setView] = useState('rendered'); 
  const [panel, setPanel] = useState(null); 
  const contentRef = useRef(null);

  useEffect(() => {
    setDraft(active?.content ?? '');
  }, [active]);

  const previewContent = useDebouncedValue(draft, 150);
  const { headings, activeId } = useToc(contentRef, active ? previewContent : null);
  const edited = Boolean(active) && draft !== active.content;

  const repo = useMutation({
    mutationFn: loadRepoRequest,
    onSuccess: (data) => {
      setView('rendered');
      setActive(data.readme ? { path: data.readme.path, content: data.readme.content } : null);
    },
  });

  const file = useMutation({
    mutationFn: getContentRequest,
    onSuccess: (data) => {
      setView('rendered');
      setActive({ path: data.path, content: data.content });
      window.scrollTo({ top: 0 });
    },
  });

  const data = repo.data;
  const error = repo.error || file.error;

  const openFile = (filePath) => {
    file.mutate({ owner: data.repo.owner, repo: data.repo.name, ref: data.ref, path: filePath });
    setPanel(null);
  };

  const reset = () => {
    repo.reset();
    file.reset();
    setActive(null);
  };

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">Read a repository</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste a public GitHub repo URL to read its docs — rendered with syntax highlighting,
          diagrams, math, and callouts.
        </p>
        <form
          className="mt-6 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (url.trim()) repo.mutate({ url: url.trim() });
          }}
        >
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            aria-label="GitHub repository URL"
          />
          <Button type="submit" disabled={repo.isPending}>
            {repo.isPending ? 'Loading…' : 'Load'}
          </Button>
        </form>
        {error && <p className="mt-4 text-sm text-destructive">{error.message}</p>}
      </main>
    );
  }

  const fileNav = (
    <FileNav
      files={data.docs}
      activePath={active?.path}
      truncated={data.docsTruncated}
      onOpen={openFile}
    />
  );
  const toc = <Toc headings={headings} activeId={activeId} onNavigate={() => setPanel(null)} />;

  return (
    <>
      <ReadingProgress />
      <main className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="min-w-0">
            <p className="truncate font-semibold">{data.repo.fullName}</p>
            {data.repo.description && (
              <p className="truncate text-sm text-muted-foreground">{data.repo.description}</p>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground">
              ★ {data.repo.stars} · {data.repo.language ?? 'n/a'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="branch">
              Branch
            </label>
            <select
              id="branch"
              value={data.ref}
              onChange={(e) => repo.mutate({ url: url.trim(), ref: e.target.value })}
              className="h-8 max-w-[10rem] rounded-md border border-input bg-transparent px-2 text-sm"
            >
              {data.branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <ThemeMenu />
            <ExportMenu
              getMarkdown={() => draft}
              getRenderedEl={() => contentRef.current}
              title={(active?.path?.split('/').pop() || data.repo.name).replace(
                /\.(md|mdx|markdown)$/i,
                '',
              )}
              disabled={!active}
            />
            <button
              type="button"
              onClick={reset}
              title="Read another repo"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-accent"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
        </div>

        <div className="mb-4 flex gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setPanel('files')}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-accent"
          >
            <Menu className="h-4 w-4" /> Files
          </button>
          <button
            type="button"
            onClick={() => setPanel('toc')}
            disabled={headings.length === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-accent disabled:opacity-40"
          >
            <ListTree className="h-4 w-4" /> Contents
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)_14rem]">
          <aside className="hidden lg:block">
            <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-auto pr-2">{fileNav}</div>
          </aside>

          <section className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="truncate text-xs text-muted-foreground">
                {active?.path}
                {edited && <span className="text-foreground"> • edited</span>}
              </p>
              {active && (
                <div className="flex shrink-0 items-center gap-2">
                  {edited && (
                    <button
                      type="button"
                      onClick={() => setDraft(active.content)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Revert
                    </button>
                  )}
                  <div className="flex overflow-hidden rounded-md border border-border text-xs">
                    <button
                      type="button"
                      onClick={() => setView('rendered')}
                      className={
                        view === 'rendered'
                          ? 'bg-accent px-2 py-1 font-medium'
                          : 'px-2 py-1 text-muted-foreground hover:bg-accent/50'
                      }
                    >
                      Rendered
                    </button>
                    <button
                      type="button"
                      onClick={() => setView('edit')}
                      className={
                        view === 'edit'
                          ? 'border-l border-border bg-accent px-2 py-1 font-medium'
                          : 'border-l border-border px-2 py-1 text-muted-foreground hover:bg-accent/50'
                      }
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>

            {file.isPending ? (
              <p className="text-sm text-muted-foreground">Loading file…</p>
            ) : active ? (
              <>
                {view === 'edit' && (
                  <MarkdownEditor
                    value={draft}
                    onChange={setDraft}
                    minHeight="18rem"
                    className="mb-4"
                  />
                )}
                <div ref={contentRef}>
                  <Markdown content={previewContent} />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">This repository has no README.</p>
            )}
          </section>

          <aside className="hidden lg:block">
            <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-auto">{toc}</div>
          </aside>
        </div>
      </main>

      {panel && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPanel(null)} />
          <div
            className={cn(
              'absolute inset-y-0 w-72 max-w-[80%] overflow-auto border-border bg-background p-4 shadow-xl',
              panel === 'files' ? 'left-0 border-r' : 'right-0 border-l',
            )}
          >
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setPanel(null)}
                aria-label="Close"
                className="rounded p-1 hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {panel === 'files' ? fileNav : toc}
          </div>
        </div>
      )}
    </>
  );
}

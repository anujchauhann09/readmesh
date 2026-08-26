'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Highlighter, ListTree, Menu, RotateCcw, Sparkles, X } from 'lucide-react';
import { loadRepoRequest, getContentRequest } from '@/lib/api/github';
import { Markdown } from '@/components/markdown/markdown';
import { MarkdownEditor } from '@/components/editor/markdown-editor';
import { ReadingProgress } from '@/components/read/reading-progress';
import { FileNav } from '@/components/read/file-nav';
import { Toc } from '@/components/read/toc';
import { ThemeMenu } from '@/components/read/theme-menu';
import { Breadcrumb } from '@/components/read/breadcrumb';
import { DocSearch } from '@/components/read/doc-search';
import { AiPanel } from '@/components/read/ai-panel';
import { AnnotationLayer } from '@/components/read/annotation-layer';
import { AnnotationsPanel } from '@/components/read/annotations-panel';
import { ExportMenu } from '@/components/export/export-menu';
import { useToc } from '@/hooks/use-toc';
import { useDocSearch } from '@/hooks/use-doc-search';
import { useAnnotations } from '@/hooks/use-annotations';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTrackRepoOpen } from '@/hooks/use-saved-repos';
import { useTrackEvent } from '@/hooks/use-analytics';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { useDialog } from '@/providers/dialog-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const EXAMPLES = [
  'https://github.com/vercel/next.js',
  'https://github.com/facebook/react',
  'https://github.com/tailwindlabs/tailwindcss',
];

export default function ReadClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dialog = useDialog();
  const trackRepoOpen = useTrackRepoOpen();
  const trackEvent = useTrackEvent();

  const repoParam = searchParams.get('repo');
  const refParam = searchParams.get('ref');
  const pathParam = searchParams.get('path');

  // URL parameters are the source of truth for *what* is being read. Modelling the
  // loads as queries rather than mutations is what makes deep links work: a query
  // keyed on the coordinates refetches when they change, survives remounts, and is
  // cached — where a mutation fired from an effect is tied to the observer that
  // started it and silently strands its result when the tree re-subscribes.
  const [source, setSource] = useState(() => ({
    slug: repoParam ?? null,
    ref: refParam ?? null,
    path: pathParam ?? null,
  }));

  const [url, setUrl] = useState(repoParam ?? '');
  const [draft, setDraft] = useState('');
  const [view, setView] = useState('rendered');
  const [panel, setPanel] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [revealDir, setRevealDir] = useState(null);
  const contentRef = useRef(null);
  const hashHandled = useRef(false);

  const repoQuery = useQuery({
    queryKey: ['github-repo', source.slug, source.ref],
    queryFn: () => loadRepoRequest({ url: source.slug, ...(source.ref ? { ref: source.ref } : {}) }),
    enabled: Boolean(source.slug),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const data = repoQuery.data;
  const readmePath = data?.readme?.path ?? null;

  // Whichever file is showing: the README comes back with the repo payload, any
  // other file is fetched on demand.
  const activePath = source.path ?? readmePath;
  const needsFetch = Boolean(data && activePath && activePath !== readmePath);

  const fileQuery = useQuery({
    queryKey: ['github-file', data?.repo?.owner, data?.repo?.name, data?.ref, activePath],
    queryFn: () =>
      getContentRequest({
        owner: data.repo.owner,
        repo: data.repo.name,
        ref: data.ref,
        path: activePath,
      }),
    enabled: needsFetch,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const active = useMemo(() => {
    if (!data) return null;
    if (needsFetch) {
      return fileQuery.data ? { path: fileQuery.data.path, content: fileQuery.data.content } : null;
    }
    return data.readme ? { path: readmePath, content: data.readme.content } : null;
  }, [data, needsFetch, fileQuery.data, readmePath]);

  const error = repoQuery.error || fileQuery.error;

  useEffect(() => {
    setDraft(active?.content ?? '');
  }, [active]);

  /**
   * Mirrors reader state into the query string so the view is linkable.
   *
   * `history.replaceState` rather than `router.replace`: the latter is a real
   * navigation that re-runs the route's server component and remounts this tree,
   * which is needless churn for what is only a bookkeeping update.
   */
  useEffect(() => {
    if (!data) return;
    const params = new URLSearchParams();
    params.set('repo', data.repo.fullName);
    params.set('ref', data.ref);
    if (active?.path) params.set('path', active.path);
    window.history.replaceState(null, '', `${pathname}?${params.toString()}`);
  }, [data, active?.path, pathname]);

  // Bookkeeping for the dashboard's "jump back in" rail and the usage summary.
  const repoKey = data ? `${data.repo.fullName}@${data.ref}` : null;
  useEffect(() => {
    if (!data) return;
    trackRepoOpen(data.repo, data.ref);
    trackEvent('REPO_OPENED', { owner: data.repo.owner, name: data.repo.name });
  }, [repoKey, data, trackRepoOpen, trackEvent]);

  useEffect(() => {
    if (!data || !fileQuery.data) return;
    trackEvent('FILE_OPENED', {
      owner: data.repo.owner,
      name: data.repo.name,
      path: fileQuery.data.path,
    });
  }, [data, fileQuery.data, trackEvent]);

  const previewContent = useDebouncedValue(draft, 150);
  const contentKey = active ? previewContent : null;
  const { headings, activeId } = useToc(contentRef, contentKey);

  const annoDoc = {
    owner: data?.repo?.owner,
    name: data?.repo?.name,
    ref: data?.ref,
    path: active?.path,
  };
  const annoScope = {
    repoOwner: data?.repo?.owner,
    repoName: data?.repo?.name,
    repoRef: data?.ref,
    filePath: active?.path,
  };

  // Annotation writes used to fail silently; surfacing the reason is the difference
  // between "the app lost my note" and "you are offline".
  const onAnnotationError = useCallback(
    (err) =>
      dialog.alert({
        title: 'Could not save that',
        description: err?.message ?? 'Your note could not be saved. Please try again.',
      }),
    [dialog],
  );
  const annotations = useAnnotations(annoDoc, { onError: onAnnotationError });
  const canAnnotate = Boolean(active) && view === 'rendered';

  // Search decorations are re-applied whenever the annotation marks are rebuilt.
  // Both layers wrap text nodes in the same subtree, so search has to run after
  // annotations — otherwise its marks are left detached and the counter goes stale.
  const annotationsKey = useMemo(
    () => annotations.annotations.map((a) => a.id).join(','),
    [annotations.annotations],
  );
  const search = useDocSearch(contentRef, contentKey ? `${contentKey}|${annotationsKey}` : null);

  const edited = Boolean(active) && draft !== active.content;

  // Heading ids are assigned once the TOC has walked the rendered document, so a
  // deep link's fragment can only be resolved after that.
  useEffect(() => {
    if (hashHandled.current || headings.length === 0) return;
    hashHandled.current = true;
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (!hash) return;
    document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [headings]);

  const openFile = (filePath) => {
    setView('rendered');
    setSource((prev) => ({ ...prev, path: filePath }));
    setPanel(null);
    window.scrollTo({ top: 0 });
  };

  const loadRepo = (nextUrl, ref) => {
    const trimmed = (nextUrl ?? '').trim();
    if (!trimmed) return;
    hashHandled.current = false;
    setView('rendered');
    setSource({ slug: trimmed, ref: ref ?? null, path: null });
  };

  const reset = () => {
    setSource({ slug: null, ref: null, path: null });
    setUrl('');
    hashHandled.current = false;
    window.history.replaceState(null, '', pathname);
  };

  const jumpToAnnotation = (a) => {
    setNotesOpen(false);
    const mark =
      a.type !== 'COMMENT' && contentRef.current?.querySelector(`mark[data-annot-id="${a.id}"]`);
    if (mark) {
      mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      mark.classList.add('rm-annot-active');
      setTimeout(() => mark.classList.remove('rm-annot-active'), 1200);
      return;
    }
    if (a.sectionId) {
      document.getElementById(a.sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  /** A link that actually reopens this repo, file and section — not just a fragment. */
  const copyAnnotationLink = (a) => {
    const params = new URLSearchParams();
    if (data?.repo?.fullName) params.set('repo', data.repo.fullName);
    if (data?.ref) params.set('ref', data.ref);
    if (a.filePath ?? active?.path) params.set('path', a.filePath ?? active.path);
    const hash = a.sectionId ? `#${encodeURIComponent(a.sectionId)}` : '';
    navigator.clipboard
      ?.writeText(`${window.location.origin}${pathname}?${params.toString()}${hash}`)
      .catch(() => {});
  };

  if (!data) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-20 text-center">
        <span className="rm-chip rm-rise">
          <span className="rm-node-dot" aria-hidden /> Repository reader
        </span>
        <h1 className="rm-rise mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Read the <span className="text-gradient">mesh</span> of any repo
        </h1>
        <p className="rm-rise-2 mt-3 max-w-md text-muted-foreground">
          Paste a public GitHub URL. readmesh renders its docs with syntax highlighting, diagrams,
          math and callouts — then lets AI explain the whole thing.
        </p>

        <form
          className="rm-rise-2 mt-8 flex w-full max-w-xl flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            loadRepo(url);
          }}
        >
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            aria-label="GitHub repository URL"
            className="h-11 flex-1 text-center sm:text-left"
          />
          <Button type="submit" size="lg" disabled={repoQuery.isFetching}>
            {repoQuery.isFetching ? 'Loading…' : 'Explore'}
          </Button>
        </form>

        <div className="rm-rise-3 mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">Try</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setUrl(ex);
                loadRepo(ex);
              }}
              className="rounded-full border border-border/70 bg-card/40 px-3 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-brand-violet/50 hover:text-foreground"
            >
              {ex.replace('https://github.com/', '')}
            </button>
          ))}
        </div>

        {repoQuery.isFetching && (
          <div className="rm-panel mt-10 w-full space-y-3 p-6 text-left">
            <div className="rm-skeleton h-6 w-1/3" />
            <div className="rm-skeleton h-4 w-2/3" />
            <div className="rm-skeleton h-4 w-1/2" />
            <div className="rm-skeleton mt-4 h-40 w-full" />
          </div>
        )}
        {error && <p className="mt-5 text-sm text-destructive">{error.message}</p>}
      </main>
    );
  }

  const fileNav = (
    <FileNav
      files={data.docs}
      activePath={active?.path}
      truncated={data.docsTruncated}
      onOpen={openFile}
      revealDir={revealDir}
    />
  );
  const toc = <Toc headings={headings} activeId={activeId} onNavigate={() => setPanel(null)} />;

  const revealDirectory = (dir) => {
    setRevealDir({ dir, nonce: Date.now() });
    if (window.matchMedia('(max-width: 1023px)').matches) setPanel('files');
  };

  return (
    <>
      <ReadingProgress />
      <main className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
        <div className="rm-panel mb-5 flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <div className="min-w-0">
            <p className="truncate font-display font-semibold tracking-tight">
              {data.repo.fullName}
            </p>
            {data.repo.description && (
              <p className="truncate text-sm text-muted-foreground">{data.repo.description}</p>
            )}
            <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rm-chip py-0.5">★ {data.repo.stars}</span>
              {data.repo.language && (
                <span className="rm-chip py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" /> {data.repo.language}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="branch">
              Branch
            </label>
            <select
              id="branch"
              value={data.ref}
              onChange={(e) => loadRepo(source.slug || data.repo.fullName, e.target.value)}
              className="h-8 max-w-[10rem] rounded-md border border-input bg-transparent px-2 text-sm"
            >
              {data.branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setNotesOpen(true)}
              disabled={!active}
              title="Notes & highlights"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-accent disabled:opacity-40"
            >
              <Highlighter className="h-4 w-4" />
              <span className="hidden sm:inline">Notes</span>
              {annotations.annotations.length > 0 && (
                <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                  {annotations.annotations.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              disabled={!active}
              title="AI assistant"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-accent disabled:opacity-40"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">AI</span>
            </button>
            <ThemeMenu />
            <ExportMenu
              getMarkdown={() => draft}
              getRenderedEl={() => contentRef.current}
              title={(active?.path?.split('/').pop() || data.repo.name).replace(
                /\.(md|mdx|markdown)$/i,
                '',
              )}
              disabled={!active}
              onExported={() =>
                trackEvent('DOCUMENT_EXPORTED', {
                  owner: data.repo.owner,
                  name: data.repo.name,
                  path: active?.path,
                })
              }
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
            <div className="mb-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Breadcrumb
                  repo={data.repo.name}
                  path={active?.path}
                  onRoot={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  onOpenDir={revealDirectory}
                />
                {edited && <span className="shrink-0 text-xs text-foreground">• edited</span>}
              </div>
              {active && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <DocSearch
                    query={search.query}
                    onQueryChange={search.setQuery}
                    count={search.count}
                    activeIndex={search.activeIndex}
                    onNext={search.next}
                    onPrev={search.prev}
                    onClear={search.clear}
                  />
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
                </div>
              )}
            </div>

            {fileQuery.isFetching ? (
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
                  <Markdown content={previewContent} collapsibleSections />
                </div>
                {canAnnotate && (
                  <AnnotationLayer
                    contentRef={contentRef}
                    contentKey={contentKey}
                    doc={annoScope}
                    annotations={annotations.annotations}
                    onCreate={(payload) => {
                      annotations.create.mutate(payload);
                      trackEvent('ANNOTATION_CREATED', {
                        owner: data.repo.owner,
                        name: data.repo.name,
                        path: active.path,
                      });
                      if (payload.type !== 'HIGHLIGHT') setNotesOpen(true);
                    }}
                    onDelete={(a) => annotations.remove.mutate(a.id)}
                  />
                )}
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
        <Drawer
          side={panel === 'files' ? 'left' : 'right'}
          label={panel === 'files' ? 'Repository files' : 'Table of contents'}
          onClose={() => setPanel(null)}
          className="w-72 max-w-[80%] p-4 lg:hidden"
          overlayClassName="z-40 lg:hidden"
          showClose
        >
          {panel === 'files' ? fileNav : toc}
        </Drawer>
      )}

      {aiOpen && active && (
        <Drawer
          side="right"
          label="AI assistant"
          onClose={() => setAiOpen(false)}
          className="w-full max-w-md"
          overlayClassName="z-50"
          blur
        >
          <AiPanel
            // Keyed on the repo, not the open file: the thread is repo-scoped, and
            // keying it to the file wiped the visible conversation on every hop.
            key={`${data.repo.fullName}@${data.ref}`}
            content={previewContent}
            repoName={data.repo.name}
            repoOwner={data.repo.owner}
            repoUrl={data.repo.fullName}
            repoRef={data.ref}
            onClose={() => setAiOpen(false)}
            onSummaryGenerated={() =>
              trackEvent('SUMMARY_GENERATED', {
                owner: data.repo.owner,
                name: data.repo.name,
                path: active.path,
              })
            }
            onQuestionAsked={() =>
              trackEvent('QUESTION_ASKED', { owner: data.repo.owner, name: data.repo.name })
            }
          />
        </Drawer>
      )}

      {notesOpen && active && (
        <Drawer
          side="right"
          label="Notes and highlights"
          onClose={() => setNotesOpen(false)}
          className="w-full max-w-md"
          overlayClassName="z-50"
          blur
        >
          <AnnotationsPanel
            annotations={annotations.annotations}
            onClose={() => setNotesOpen(false)}
            onJump={jumpToAnnotation}
            onCopyLink={copyAnnotationLink}
            onDelete={(a) => annotations.remove.mutate(a.id)}
          />
        </Drawer>
      )}
    </>
  );
}

/**
 * Slide-over panel with the accessibility parts the reader's drawers were missing:
 * dialog semantics, Escape to close, and focus contained inside while open.
 */
function Drawer({ side, label, onClose, className, overlayClassName, blur, showClose, children }) {
  const panelRef = useRef(null);
  useFocusTrap(panelRef, { onEscape: onClose });

  return (
    <div className={cn('fixed inset-0', overlayClassName)}>
      <div
        className={cn('absolute inset-0 bg-black/50', blur && 'backdrop-blur-sm')}
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn(
          'rm-modal-in absolute inset-y-0 overflow-auto border-border bg-popover/90 shadow-2xl backdrop-blur-2xl',
          side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
          className,
        )}
      >
        {/* The AI and notes panels ship their own close button; the nav drawers do not. */}
        {showClose && (
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded p-1 hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Columns2, Eye, Pencil, Plus, Sparkles } from 'lucide-react';
import { MarkdownEditor } from '@/components/editor/markdown-editor';
import { Markdown } from '@/components/markdown/markdown';
import { ThemeMenu } from '@/components/read/theme-menu';
import { Logo } from '@/components/brand/logo';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useAuthGate } from '@/providers/auth-gate-provider';
import { DRAFT_KEY, HOME_SAMPLE as SAMPLE } from '@/lib/documents/draft';
import { cn } from '@/lib/utils';

const VIEWS = [
  { key: 'editor', label: 'Editor', icon: Pencil },
  { key: 'split', label: 'Split', icon: Columns2 },
  { key: 'preview', label: 'Preview', icon: Eye },
];

export default function HomePage() {
  const router = useRouter();
  const { user, requireAuth, openAuth } = useAuthGate();

  const [source, setSource] = useState('');
  const [view, setView] = useState('split');
  const [ready, setReady] = useState(false);
  const previewRef = useRef(null);
  const preview = useDebouncedValue(source, 150);

  // Load the saved draft once on mount (falls back to the sample document).
  useEffect(() => {
    const saved =
      typeof window !== 'undefined' ? window.localStorage.getItem(DRAFT_KEY) : null;
    setSource(saved ?? SAMPLE);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && typeof window !== 'undefined') {
      window.localStorage.setItem(DRAFT_KEY, source);
    }
  }, [source, ready]);

  const title = useMemo(() => {
    const m = source.match(/^#\s+(.+)$/m);
    return m ? m[1].trim() : 'Untitled document';
  }, [source]);

  const words = useMemo(() => source.trim().split(/\s+/).filter(Boolean).length, [source]);

  const newDoc = () => setSource('# Untitled\n\n');

  const onAi = () =>
    requireAuth(() => router.push('/read'), {
      title: 'Sign in to use AI',
      description: 'AI summaries, chat, explanations, and translations live in the repo reader.',
    });

  const showEditor = view !== 'preview';
  const showPreview = view !== 'editor';

  return (
    <div className="flex h-screen flex-col">
      <header className="glass-bar z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/70 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="shrink-0">
            <Logo markSize={26} />
          </Link>
          <span className="hidden h-5 w-px bg-border md:block" />
          <div className="hidden min-w-0 items-center gap-2 md:flex">
            <span className="rm-node-dot" aria-hidden />
            <p className="min-w-0 truncate text-sm text-muted-foreground">{title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center rounded-lg border border-border/70 bg-card/40 p-0.5 text-xs backdrop-blur-sm sm:flex">
            {VIEWS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                title={label}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-all',
                  view === key
                    ? 'bg-accent font-medium text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">{label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onAi}
            title="AI assistant"
            className="group inline-flex items-center gap-1.5 rounded-lg border border-brand-violet/40 bg-brand-violet/10 px-2.5 py-1.5 text-sm font-medium text-foreground transition-all hover:border-brand-violet/70 hover:bg-brand-violet/20"
          >
            <Sparkles className="h-4 w-4 text-brand-violet transition-transform group-hover:scale-110" />
            <span className="hidden sm:inline">AI</span>
          </button>

          <ThemeMenu />

          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-[0_8px_24px_-10px_hsl(var(--brand-violet)/0.7)] transition-all hover:bg-primary/90"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => openAuth()}
              className="inline-flex items-center rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground shadow-[0_8px_24px_-10px_hsl(var(--brand-violet)/0.7)] transition-all hover:bg-primary/90"
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      <div className="z-10 flex shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-background/40 px-4 py-1.5 backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={newDoc}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" /> New
          </button>
          <Link
            href="/read"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <BookOpen className="h-3.5 w-3.5" /> Read a repo
          </Link>
        </div>
        <div className="flex items-center gap-3 text-[0.7rem] text-muted-foreground">
          <span className="hidden tabular-nums sm:inline">{words} words</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan shadow-[0_0_6px_hsl(var(--brand-cyan))]" />
            Draft saved locally
          </span>
        </div>
      </div>

      {/* Workspace — floating glass panels over the mesh */}
      <div
        className={cn(
          'grid min-h-0 flex-1 gap-3 p-3',
          showEditor && showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1',
        )}
      >
        {showEditor && (
          <Panel
            label="Editor"
            className={cn(view === 'split' && 'hidden lg:flex')}
            badge="Markdown"
          >
            <MarkdownEditor
              value={source}
              onChange={setSource}
              minHeight="100%"
              allowImagePaste={false}
              className="min-h-0 flex-1 rounded-none border-0 bg-transparent"
            />
          </Panel>
        )}
        {showPreview && (
          <Panel label="Live preview" live>
            <div className="min-h-0 flex-1 overflow-auto" ref={previewRef}>
              <div className="mx-auto max-w-3xl px-6 py-7">
                <Markdown content={preview} collapsibleSections />
              </div>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

function Panel({ label, badge, live, className, children }) {
  return (
    <section
      className={cn(
        'rm-panel flex min-h-0 flex-col overflow-hidden rm-rise',
        className,
      )}
    >
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border/70 px-3">
        <span className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {live ? <span className="rm-node-dot" aria-hidden /> : null}
          {label}
        </span>
        {badge && (
          <span className="font-mono text-[0.65rem] text-muted-foreground/70">{badge}</span>
        )}
      </div>
      {children}
    </section>
  );
}

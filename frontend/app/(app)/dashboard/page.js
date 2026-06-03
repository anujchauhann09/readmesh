'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, BookOpen, FileText, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useDocuments } from '@/hooks/use-documents';
import { useDialog } from '@/providers/dialog-provider';

const formatDate = (value) => {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { documents, isLoading, create, remove } = useDocuments();
  const dialog = useDialog();

  if (!user) return null;

  const newDocument = () =>
    create.mutate(
      { content: '# Untitled\n\n' },
      { onSuccess: (d) => router.push(`/editor/${d.id}`) },
    );

  const deleteDocument = async (doc) => {
    const ok = await dialog.confirm({
      title: `Delete “${doc.title}”?`,
      description: 'This permanently removes it from your saved documents.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (ok) remove.mutate(doc.id);
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="rm-rise">
        <span className="rm-chip">
          <span className="rm-node-dot" aria-hidden /> Workspace
        </span>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Welcome back{user.displayName ? <span className="text-gradient">, {user.displayName}</span> : ''}.
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Your saved documents live here, and you can point readmesh at any codebase to explore the
          mesh of knowledge inside it.
        </p>
      </div>

      {/* Documents */}
      <section className="rm-rise-2 mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <span className="rm-node-dot" aria-hidden /> Your documents
          </h2>
          <button
            type="button"
            onClick={newDocument}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-[0_8px_24px_-10px_hsl(var(--brand-violet)/0.7)] transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" /> New document
          </button>
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rm-skeleton h-24" />
            <div className="rm-skeleton h-24" />
          </div>
        ) : documents.length === 0 ? (
          <div className="rm-panel flex flex-col items-center gap-3 p-10 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-border/70 bg-card/60 text-brand-violet">
              <FileText className="h-6 w-6" />
            </span>
            <div>
              <p className="font-medium">No documents yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Anything you write on the home canvas before signing in shows up here. Start a fresh
                one anytime.
              </p>
            </div>
            <button
              type="button"
              onClick={newDocument}
              className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/40 px-3 py-1.5 text-sm transition-colors hover:border-brand-violet/40 hover:bg-accent"
            >
              <Plus className="h-4 w-4" /> Create your first document
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="rm-panel group relative flex flex-col gap-2 p-4 transition-all hover:-translate-y-0.5 hover:border-brand-violet/50"
              >
                <Link href={`/editor/${doc.id}`} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border/70 bg-card/60 text-brand-violet">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{doc.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Edited {formatDate(doc.updatedAt)}
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
                <button
                  type="button"
                  onClick={() => deleteDocument(doc)}
                  aria-label="Delete document"
                  title="Delete document"
                  className="absolute bottom-3 right-3 rounded-md p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Repo reader + AI */}
      <div className="rm-rise-3 mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Link
          href="/read"
          className="rm-panel group flex items-center justify-between gap-3 p-5 transition-all hover:-translate-y-0.5 hover:border-brand-violet/50"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border/70 bg-card/60 text-brand-violet">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight">Read a repository</p>
              <p className="text-sm text-muted-foreground">
                Render any public GitHub repo&apos;s docs and ask AI about them.
              </p>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
        </Link>

        <div className="rm-panel flex items-center gap-3 p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-brand-violet/40 bg-brand-violet/10 text-brand-violet">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-medium">AI lives in the reader</p>
            <p className="text-sm text-muted-foreground">
              Summaries, beginner mode, translations and grounded chat — open a repo to use them.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

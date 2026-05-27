'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { loadRepoRequest, getContentRequest } from '@/lib/api/github';
import { Markdown } from '@/components/markdown/markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ReadPage() {
  const [url, setUrl] = useState('');
  const [active, setActive] = useState(null); // { path, content }
  const [view, setView] = useState('rendered'); // 'rendered' | 'source'

  const repo = useMutation({
    mutationFn: loadRepoRequest,
    onSuccess: (data) =>
      setActive(data.readme ? { path: data.readme.path, content: data.readme.content } : null),
  });

  const file = useMutation({
    mutationFn: getContentRequest,
    onSuccess: (data) => setActive({ path: data.path, content: data.content }),
  });

  const data = repo.data;
  const error = repo.error || file.error;

  const openFile = (filePath) =>
    file.mutate({ owner: data.repo.owner, repo: data.repo.name, ref: data.ref, path: filePath });

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
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

      {data && (
        <div className="mt-8 grid gap-6 md:grid-cols-[18rem_1fr]">
          <aside className="space-y-4">
            <div className="rounded-lg border border-border p-4">
              <p className="font-medium">{data.repo.fullName}</p>
              {data.repo.description && (
                <p className="mt-1 text-sm text-muted-foreground">{data.repo.description}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                ★ {data.repo.stars} · {data.repo.language ?? 'n/a'}
              </p>
              <label className="mt-3 block text-xs text-muted-foreground">
                Branch
                <select
                  className="mt-1 flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                  value={data.ref}
                  onChange={(e) => repo.mutate({ url: url.trim(), ref: e.target.value })}
                >
                  {data.branches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <nav className="rounded-lg border border-border p-2">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                Markdown files ({data.docs.length}
                {data.docsTruncated ? '+' : ''})
              </p>
              <ul className="max-h-[28rem] overflow-auto">
                {data.docs.map((f) => (
                  <li key={f.path}>
                    <button
                      type="button"
                      onClick={() => openFile(f.path)}
                      className={`w-full truncate rounded px-2 py-1 text-left text-sm hover:bg-accent ${
                        active?.path === f.path ? 'bg-accent font-medium' : ''
                      }`}
                      title={f.path}
                    >
                      {f.path}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <section className="min-w-0">
            {file.isPending ? (
              <p className="text-sm text-muted-foreground">Loading file…</p>
            ) : active ? (
              <>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-muted-foreground">{active.path}</p>
                  <div className="flex shrink-0 overflow-hidden rounded-md border border-border text-xs">
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
                      onClick={() => setView('source')}
                      className={
                        view === 'source'
                          ? 'border-l border-border bg-accent px-2 py-1 font-medium'
                          : 'border-l border-border px-2 py-1 text-muted-foreground hover:bg-accent/50'
                      }
                    >
                      Source
                    </button>
                  </div>
                </div>
                {view === 'rendered' ? (
                  <Markdown content={active.content} />
                ) : (
                  <pre className="overflow-auto rounded-lg border border-border bg-card p-4 text-sm">
                    <code className="whitespace-pre-wrap break-words">{active.content}</code>
                  </pre>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">This repository has no README.</p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

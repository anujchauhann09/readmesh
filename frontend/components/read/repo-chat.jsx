'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Send, Sparkles, Square, SquarePen } from 'lucide-react';
import { useRepoChat } from '@/hooks/use-repo-chat';
import { Markdown } from '@/components/markdown/markdown';
import { linkCitations } from '@/lib/markdown/citations';

const SUGGESTIONS = [
  'How do I run this project?',
  'What environment variables are required?',
  'How does authentication work?',
  'Which database does it use?',
];

export function RepoChat({ url, repoRef, owner, name, onQuestionAsked }) {
  const { messages, send, stop, reset, isPending, isRestoring } = useRepoChat({
    url,
    ref: repoRef,
    owner,
    name,
  });
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const ask = (question) => {
    send(question);
    onQuestionAsked?.();
  };

  const submit = (e) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;
    ask(input);
    setInput('');
  };

  return (
    <div className="flex h-full flex-col">
      {messages.length > 0 && (
        <div className="mb-2 flex shrink-0 justify-end">
          <button
            type="button"
            onClick={reset}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
          >
            <SquarePen className="h-3.5 w-3.5" /> New chat
          </button>
        </div>
      )}

      <div
        className="min-h-0 flex-1 space-y-3 overflow-auto"
        aria-live="polite"
        aria-busy={isPending || isRestoring}
      >
        {isRestoring && (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading conversation…</p>
        )}

        {!isRestoring && messages.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan">
              <Sparkles className="h-5 w-5" />
            </span>
            <p className="max-w-[16rem] text-sm text-muted-foreground">
              Ask anything about this repository. Answers are grounded in its docs, with sources.
            </p>
            <div className="flex flex-col gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="rounded-lg border border-border/70 bg-card/40 px-2.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-brand-violet/50 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <Message key={i} message={m} />
        ))}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={submit}
        className="mt-3 flex shrink-0 items-end gap-2 border-t border-border pt-3"
      >
        <label htmlFor="repo-chat-input" className="sr-only">
          Ask about this repository
        </label>
        <textarea
          id="repo-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) submit(e);
          }}
          rows={1}
          placeholder="Ask about this repo…"
          className="max-h-28 min-h-[2.25rem] flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none"
        />
        {isPending ? (
          <button
            type="button"
            onClick={stop}
            aria-label="Stop generating"
            title="Stop generating"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border hover:bg-accent"
          >
            <Square className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            aria-label="Send"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        )}
      </form>
    </div>
  );
}

function Message({ message }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.role === 'error') {
    return <p className="text-sm text-destructive">{message.content}</p>;
  }

  if (message.streaming && !message.content) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Searching the docs…
      </div>
    );
  }

  return <AssistantMessage message={message} />;
}

function AssistantMessage({ message }) {
  const rootRef = useRef(null);
  const sources = message.sources ?? [];

  // Delegated so every citation link in the rendered Markdown is covered without
  // threading a handler through the renderer.
  const onClick = (e) => {
    const link = e.target.closest('a[href^="#cite-"]');
    if (!link) return;
    e.preventDefault();
    const n = link.getAttribute('href').slice('#cite-'.length);
    const el = rootRef.current?.querySelector(`[data-cite="${n}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    el.classList.add('cite-flash');
    setTimeout(() => el.classList.remove('cite-flash'), 1200);
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      ref={rootRef}
      className="rounded-lg border border-border bg-muted/30 px-3 py-2"
      onClick={onClick}
    >
      <div className="text-sm">
        <Markdown content={linkCitations(message.content, sources)} />
      </div>
      {sources.length > 0 && (
        <div className="mt-2 border-t border-border pt-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Sources
          </p>
          <ul className="space-y-0.5">
            {sources.map((s) => (
              <li
                key={s.number}
                data-cite={s.number}
                className="truncate rounded px-1 text-xs text-muted-foreground transition-colors"
                title={s.path}
              >
                <span className="text-foreground">[{s.number}]</span> {s.path}
                {s.heading ? ` › ${s.heading}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

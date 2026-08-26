'use client';

import { useState } from 'react';
import {
  Check,
  Copy,
  FileText,
  GraduationCap,
  Languages,
  Loader2,
  MessageSquare,
  RotateCcw,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react';
import { SUMMARY_LANGUAGES } from '@readmesh/shared';
import { useSummary } from '@/hooks/use-summary';
import { Markdown } from '@/components/markdown/markdown';
import { RepoChat } from '@/components/read/repo-chat';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'chat', label: 'Chat', icon: MessageSquare },
  { key: 'tldr', label: 'TL;DR', icon: FileText },
  { key: 'commands', label: 'Commands', icon: Terminal },
  { key: 'beginner', label: 'Beginner', icon: GraduationCap },
  { key: 'translate', label: 'Translate', icon: Languages },
];

// The API client normalizes failures into real Errors carrying the server's
// message, so there is no response object left to dig through here.
const errorMessage = (error) => error?.message || 'Something went wrong.';

export function AiPanel({
  content,
  repoName,
  repoUrl,
  repoRef,
  repoOwner,
  onClose,
  onSummaryGenerated,
  onQuestionAsked,
}) {
  const [tab, setTab] = useState('chat');
  const [language, setLanguage] = useState(SUMMARY_LANGUAGES[0].code);
  const { tldr, commands, beginner, translate } = useSummary();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-brand-violet/40 bg-brand-violet/10 text-brand-violet">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">AI Assistant</p>
            {repoName && <p className="truncate text-xs text-muted-foreground">{repoName}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close AI assistant"
          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex shrink-0 gap-1 border-b border-border px-2 py-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
              tab === key
                ? 'border border-brand-violet/40 bg-brand-violet/10 text-foreground'
                : 'border border-transparent text-muted-foreground hover:bg-accent/50',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {tab === 'chat' ? (
        <div className="min-h-0 flex-1 p-4">
          <RepoChat
            url={repoUrl}
            repoRef={repoRef}
            owner={repoOwner}
            name={repoName}
            onQuestionAsked={onQuestionAsked}
          />
        </div>
      ) : (
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {tab === 'tldr' && (
          <Feature
            mutation={tldr}
            idleHint="Generate a TL;DR, key commands, tech stack and highlights for this file."
            onGenerate={() => {
              onSummaryGenerated?.();
              tldr.mutate({ content, repoName });
            }}
          >
            {(data) => <TldrView summary={data.summary} truncated={data.truncated} />}
          </Feature>
        )}

        {tab === 'commands' && (
          <Feature
            mutation={commands}
            idleHint="Extract the runnable commands from this file."
            onGenerate={() => {
              onSummaryGenerated?.();
              commands.mutate({ content });
            }}
          >
            {(data) => <CommandList commands={data.commands} />}
          </Feature>
        )}

        {tab === 'beginner' && (
          <Feature
            mutation={beginner}
            idleHint="Rewrite this file in simple, beginner-friendly English."
            onGenerate={() => {
              onSummaryGenerated?.();
              beginner.mutate({ content });
            }}
          >
            {(data) => (
              <>
                <TruncatedNote show={data.truncated} />
                <Markdown content={data.markdown} />
              </>
            )}
          </Feature>
        )}

        {tab === 'translate' && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="h-8 flex-1 rounded-md border border-input bg-transparent px-2 text-sm"
                aria-label="Translation language"
              >
                {SUMMARY_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <Feature
              mutation={translate}
              idleHint="Choose a language above, then translate this file."
              generateLabel="Translate"
              onGenerate={() => {
                onSummaryGenerated?.();
                translate.mutate({ content, language });
              }}
            >
              {(data) => (
                <>
                  <TruncatedNote show={data.truncated} />
                  <Markdown content={data.markdown} />
                </>
              )}
            </Feature>
          </div>
        )}
      </div>
      )}
    </div>
  );
}

function Feature({ mutation, idleHint, generateLabel = 'Generate', onGenerate, children }) {
  if (mutation.isPending) return <Loading />;

  if (mutation.isError) {
    return <ErrorView message={errorMessage(mutation.error)} onRetry={onGenerate} />;
  }

  if (mutation.isSuccess) {
    return (
      <div>
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={onGenerate}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> Regenerate
          </button>
        </div>
        {children(mutation.data)}
      </div>
    );
  }

  return <IdleView hint={idleHint} label={generateLabel} onGenerate={onGenerate} />;
}

function IdleView({ hint, label, onGenerate }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-brand-violet/30 bg-brand-violet/10 text-brand-violet rm-float">
        <Sparkles className="h-6 w-6" />
      </span>
      <p className="max-w-[16rem] text-sm text-muted-foreground">{hint}</p>
      <button
        type="button"
        onClick={onGenerate}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-[0_8px_24px_-10px_hsl(var(--brand-violet)/0.7)] transition-all hover:bg-primary/90 active:scale-[0.98]"
      >
        <Sparkles className="h-3.5 w-3.5" /> {label}
      </button>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Generating…
    </div>
  );
}

function ErrorView({ message, onRetry }) {
  return (
    <div className="py-6">
      <p className="text-sm text-destructive">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-accent"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Try again
      </button>
    </div>
  );
}

function TruncatedNote({ show }) {
  if (!show) return null;
  return (
    <p className="mb-3 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
      This document was long, so only the beginning was processed.
    </p>
  );
}

function TldrView({ summary, truncated }) {
  if (!summary) return null;
  return (
    <div className="space-y-4 text-sm">
      <TruncatedNote show={truncated} />
      <p className="leading-6">{summary.tldr}</p>

      <Section title="What it does">
        <p className="leading-6 text-muted-foreground">{summary.whatItDoes}</p>
      </Section>

      <Section title="Who it's for">
        <p className="leading-6 text-muted-foreground">{summary.whoItsFor}</p>
      </Section>

      {summary.howToRun?.length > 0 && (
        <Section title="How to run">
          <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
            {summary.howToRun.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </Section>
      )}

      {summary.keyCommands?.length > 0 && (
        <Section title="Key commands">
          <CommandList commands={summary.keyCommands} />
        </Section>
      )}

      {summary.techStack?.length > 0 && (
        <Section title="Tech stack">
          <div className="flex flex-wrap gap-1.5">
            {summary.techStack.map((tech, i) => (
              <span key={i} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                {tech}
              </span>
            ))}
          </div>
        </Section>
      )}

      {summary.highlights?.length > 0 && (
        <Section title="Highlights">
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            {summary.highlights.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function CommandList({ commands }) {
  if (!commands || commands.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">No commands found in this document.</p>;
  }
  return (
    <ul className="space-y-2">
      {commands.map((cmd, i) => (
        <li key={i} className="rounded-md border border-border">
          <div className="flex items-center gap-2 bg-muted/50 px-2 py-1.5">
            <code className="min-w-0 flex-1 truncate font-mono text-xs">{cmd.command}</code>
            {cmd.category && (
              <span className="shrink-0 rounded bg-background px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                {cmd.category}
              </span>
            )}
            <CopyButton text={cmd.command} />
          </div>
          {cmd.description && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">{cmd.description}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy command"
      title="Copy command"
      className="shrink-0 rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

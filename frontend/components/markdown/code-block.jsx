'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { Check, Copy } from 'lucide-react';
import { highlightCode, shikiThemeFor } from '@/lib/markdown/shiki';
import { cn } from '@/lib/utils';

// Below this, numbers are noise rather than navigation.
const MIN_LINES_FOR_NUMBERS = 3;

/**
 * Parses the highlight request from a fence's info string.
 *
 * ```js {2,5-7}  →  Set { 2, 5, 6, 7 }
 *
 * The `{…}` convention is what Shiki, Docusaurus and Nextra all use, so a README
 * written for any of those renders its emphasis here too.
 */
export const parseHighlightedLines = (meta = '') => {
  const match = /\{([\d,\s-]+)\}/.exec(meta);
  if (!match) return null;

  const lines = new Set();
  for (const part of match[1].split(',')) {
    const range = part.trim();
    if (!range) continue;
    const [from, to] = range.split('-').map((n) => Number.parseInt(n, 10));
    if (!Number.isFinite(from)) continue;
    const end = Number.isFinite(to) ? to : from;
    for (let i = from; i <= end && i - from < 500; i += 1) lines.add(i);
  }
  return lines.size ? lines : null;
};

export function CodeBlock({ code, lang, meta = '' }) {
  const { theme, resolvedTheme } = useTheme();
  const [html, setHtml] = useState(null);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef(null);

  const lineCount = code.split('\n').length;
  const showNumbers = lineCount >= MIN_LINES_FOR_NUMBERS;

  useEffect(() => {
    let cancelled = false;
    highlightCode(code, lang, shikiThemeFor(theme, resolvedTheme)).then((out) => {
      if (!cancelled) setHtml(out);
    });
    return () => {
      cancelled = true;
    };
  }, [code, lang, theme, resolvedTheme]);

  /**
   * Decorates Shiki's own `.line` spans after they land in the DOM.
   *
   * Numbering via a CSS counter on real line elements keeps the numbers out of the
   * text layer, so selecting and copying the block still yields just the code.
   */
  useEffect(() => {
    const root = containerRef.current;
    if (!root || !html) return;

    const highlighted = parseHighlightedLines(meta);
    root.querySelectorAll('.line').forEach((line, index) => {
      line.setAttribute('data-line', String(index + 1));
      line.classList.toggle('line--highlighted', Boolean(highlighted?.has(index + 1)));
    });
    root.classList.toggle('has-line-numbers', showNumbers);
    // `dimmed` fades the untouched lines so the emphasis reads as emphasis.
    root.classList.toggle('has-highlighted-lines', Boolean(highlighted));
  }, [html, meta, showNumbers]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">{lang || 'text'}</span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy code"
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {html ? (
        <div
          ref={containerRef}
          className="shiki-container overflow-x-auto text-sm"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className={cn('overflow-x-auto p-4 text-sm')}>
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

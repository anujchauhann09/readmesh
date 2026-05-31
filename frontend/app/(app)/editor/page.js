'use client';

import { useMemo, useRef, useState } from 'react';
import { MarkdownEditor } from '@/components/editor/markdown-editor';
import { Markdown } from '@/components/markdown/markdown';
import { ExportMenu } from '@/components/export/export-menu';
import { ThemeMenu } from '@/components/read/theme-menu';
import { DocSearch } from '@/components/read/doc-search';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useDocSearch } from '@/hooks/use-doc-search';
import { cn } from '@/lib/utils';

const SAMPLE = `# Markdown Editor

A live playground for the **readmesh** rendering engine. Edit on the left — the
preview updates as you type, and you can *export* the result when you're done.

## What it supports

- GitHub-flavored markdown: **bold**, *italic*, ~~strikethrough~~
- Task lists:
  - [x] live preview
  - [ ] export to PDF
- Inline code like \`npm install\` and fenced blocks:

\`\`\`js
function add(a, b) {
  return a + b;
}
console.log(add(2, 3));
\`\`\`

> [!TIP]
> Switch the theme (top-right) and watch the code block re-highlight instantly.

## Math

Inline math such as $a^2 + b^2 = c^2$, and display math:

$$ E = mc^2 $$

## A table

| Feature   | Status |
| --------- | ------ |
| Preview   | ✅     |
| Export    | ✅     |

## A diagram

\`\`\`mermaid
flowchart LR
  A[Edit] --> B[Preview]
  B --> C[Export]
\`\`\`

Paste an image straight into the editor to embed it, or use the image button to
add one by URL.
`;

const titleFromMarkdown = (md) => {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : 'document';
};

export default function EditorPage() {
  const [source, setSource] = useState(SAMPLE);
  const [mobileView, setMobileView] = useState('edit'); 
  const preview = useDebouncedValue(source, 150);
  const previewRef = useRef(null);
  const search = useDocSearch(previewRef, preview);
  const title = useMemo(() => titleFromMarkdown(source), [source]);

  return (
    <main className="mx-auto max-w-[88rem] px-4 py-6 lg:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">Markdown Editor</h1>
          <p className="text-sm text-muted-foreground">
            Edit on the left, see it rendered live on the right. Export when you&apos;re done.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-border text-xs lg:hidden">
            <button
              type="button"
              onClick={() => setMobileView('edit')}
              className={
                mobileView === 'edit'
                  ? 'bg-accent px-2 py-1 font-medium'
                  : 'px-2 py-1 text-muted-foreground'
              }
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setMobileView('preview')}
              className={
                mobileView === 'preview'
                  ? 'border-l border-border bg-accent px-2 py-1 font-medium'
                  : 'border-l border-border px-2 py-1 text-muted-foreground'
              }
            >
              Preview
            </button>
          </div>
          <ThemeMenu />
          <ExportMenu
            getMarkdown={() => source}
            getRenderedEl={() => previewRef.current}
            title={title}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MarkdownEditor
          value={source}
          onChange={setSource}
          minHeight="72vh"
          className={cn('w-full', mobileView === 'preview' && 'hidden lg:flex')}
        />
        <div
          className={cn(
            'flex max-h-[72vh] flex-col rounded-lg border border-border',
            mobileView === 'edit' && 'hidden lg:flex',
          )}
        >
          <div className="flex items-center border-b border-border p-2">
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
    </main>
  );
}

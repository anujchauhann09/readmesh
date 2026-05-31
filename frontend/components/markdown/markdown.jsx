'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize from 'rehype-sanitize';
import 'katex/dist/katex.min.css';

import { remarkCallouts } from '@/lib/markdown/remark-callouts';
import { sanitizeSchema } from '@/lib/markdown/sanitize-schema';
import { rehypeCollapsibleSections } from '@/lib/markdown/rehype-collapsible';
import { parseEmbed } from '@/lib/markdown/embeds';
import { CodeBlock } from './code-block';
import { Mermaid } from './mermaid';
import { Callout } from './callout';
import { MarkdownImage } from './markdown-image';
import { Embed } from './embed';
import { CollapsibleSection } from './collapsible-section';

const REMARK_PLUGINS = [remarkGfm, remarkMath, remarkCallouts];
const REHYPE_PLUGINS = [rehypeRaw, [rehypeSanitize, sanitizeSchema], rehypeKatex];
const REHYPE_PLUGINS_COLLAPSIBLE = [...REHYPE_PLUGINS, rehypeCollapsibleSections];

const nodeText = (node) =>
  (node?.children ?? []).map((c) => (c.type === 'text' ? c.value : nodeText(c))).join('');

const components = {
  pre({ node, children }) {
    const codeEl = node?.children?.find((c) => c.tagName === 'code');
    if (!codeEl) {
      return (
        <pre className="my-4 overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 text-sm">
          {children}
        </pre>
      );
    }
    const className = codeEl.properties?.className?.[0] ?? '';
    const lang = /language-(\S+)/.exec(className)?.[1];
    const code = nodeText(codeEl).replace(/\n$/, '');
    return lang === 'mermaid' ? <Mermaid code={code} /> : <CodeBlock code={code} lang={lang} />;
  },
  code({ children }) {
    return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>;
  },
  blockquote({ node, children }) {
    const cls = node?.properties?.className;
    const callout = Array.isArray(cls) ? cls.find((c) => c.startsWith('callout-')) : null;
    if (callout) return <Callout type={callout.replace('callout-', '')}>{children}</Callout>;
    return (
      <blockquote className="my-4 border-l-4 border-border pl-4 italic text-muted-foreground">
        {children}
      </blockquote>
    );
  },
  img: ({ src, alt, width, height }) => (
    <MarkdownImage src={src} alt={alt} width={width} height={height} />
  ),
  p({ node, children }) {
    const kids = node?.children ?? [];
    if (kids.length === 1 && kids[0].type === 'element' && kids[0].tagName === 'a') {
      const embed = parseEmbed(kids[0].properties?.href);
      if (embed) return <Embed embed={embed} />;
    }
    return <p className="my-4 leading-7">{children}</p>;
  },
  a({ href, children }) {
    const external = /^https?:\/\//i.test(href || '');
    return (
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="font-medium text-primary underline underline-offset-2 hover:no-underline"
      >
        {children}
      </a>
    );
  },
  section({ node, children }) {
    const depth = Number(node?.properties?.dataDepth) || undefined;
    if (!depth) return <section>{children}</section>;
    return <CollapsibleSection depth={depth}>{children}</CollapsibleSection>;
  },
};

export function Markdown({ content = '', collapsibleSections = false }) {
  return (
    <div className="markdown-body min-w-0">
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={collapsibleSections ? REHYPE_PLUGINS_COLLAPSIBLE : REHYPE_PLUGINS}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

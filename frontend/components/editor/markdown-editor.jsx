'use client';

import { useRef } from 'react';
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
  Table,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDialog } from '@/providers/dialog-provider';

const setCaret = (ta, start, end) => {
  requestAnimationFrame(() => {
    ta.focus();
    ta.setSelectionRange(start, end);
  });
};

export function MarkdownEditor({ value, onChange, className, minHeight = '24rem' }) {
  const ref = useRef(null);
  const dialog = useDialog();

  const toggleWrap = (marker, placeholder = '') => {
    const ta = ref.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const sel = value.slice(s, e);
    const m = marker.length;

    if (sel.length >= m * 2 && sel.startsWith(marker) && sel.endsWith(marker)) {
      const inner = sel.slice(m, sel.length - m);
      onChange(value.slice(0, s) + inner + value.slice(e));
      setCaret(ta, s, s + inner.length);
      return;
    }

    if (value.slice(s - m, s) === marker && value.slice(e, e + m) === marker) {
      onChange(value.slice(0, s - m) + sel + value.slice(e + m));
      setCaret(ta, s - m, e - m);
      return;
    }
    const text = sel || placeholder;
    onChange(value.slice(0, s) + marker + text + marker + value.slice(e));
    setCaret(ta, s + m, s + m + text.length);
  };

  const prefixLines = (makePrefix) => {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: start, selectionEnd: end } = ta;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const block = value.slice(lineStart, end);
    const replaced = block
      .split('\n')
      .map((line, i) => makePrefix(i) + line)
      .join('\n');
    onChange(value.slice(0, lineStart) + replaced + value.slice(end));
    setCaret(ta, lineStart, lineStart + replaced.length);
  };

  const replaceRange = (start, end, text) => {
    const ta = ref.current;
    if (!ta) return;
    onChange(value.slice(0, start) + text + value.slice(end));
    setCaret(ta, start + text.length, start + text.length);
  };

  const insertAtCursor = (text) => {
    const ta = ref.current;
    if (!ta) return;
    replaceRange(ta.selectionStart, ta.selectionEnd, text);
  };

  const addLink = async () => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);
    const result = await dialog.prompt({
      title: 'Insert link',
      submitLabel: 'Insert',
      fields: [
        { name: 'text', label: 'Text', defaultValue: selected, placeholder: 'link text' },
        { name: 'url', label: 'URL', defaultValue: 'https://', placeholder: 'https://', required: true },
      ],
    });
    if (!result?.url) return;
    replaceRange(start, end, `[${result.text || result.url}](${result.url})`);
  };

  const addImage = async () => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const result = await dialog.prompt({
      title: 'Insert image',
      submitLabel: 'Insert',
      fields: [
        { name: 'url', label: 'Image URL', defaultValue: 'https://', placeholder: 'https://', required: true },
        { name: 'alt', label: 'Alt text (optional)', placeholder: 'description' },
      ],
    });
    if (!result?.url) return;
    replaceRange(start, end, `![${result.alt || ''}](${result.url})`);
  };

  const onPaste = (e) => {
    const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
    const file = item?.getAsFile();
    if (!file) return;
    e.preventDefault();
    const reader = new FileReader();
    reader.onload = () => insertAtCursor(`![pasted image](${reader.result})`);
    reader.readAsDataURL(file);
  };

  const Btn = ({ title, onClick, children }) => (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {children}
    </button>
  );
  const Sep = () => <span className="mx-1 h-5 w-px bg-border" />;

  return (
    <div className={cn('flex flex-col rounded-lg border border-border', className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-1.5 py-1">
        <Btn title="Heading 1" onClick={() => prefixLines(() => '# ')}>
          <Heading1 className="h-4 w-4" />
        </Btn>
        <Btn title="Heading 2" onClick={() => prefixLines(() => '## ')}>
          <Heading2 className="h-4 w-4" />
        </Btn>
        <Btn title="Heading 3" onClick={() => prefixLines(() => '### ')}>
          <Heading3 className="h-4 w-4" />
        </Btn>
        <Sep />
        <Btn title="Bold" onClick={() => toggleWrap('**', 'bold')}>
          <Bold className="h-4 w-4" />
        </Btn>
        <Btn title="Italic" onClick={() => toggleWrap('*', 'italic')}>
          <Italic className="h-4 w-4" />
        </Btn>
        <Btn title="Strikethrough" onClick={() => toggleWrap('~~', 'text')}>
          <Strikethrough className="h-4 w-4" />
        </Btn>
        <Btn title="Inline code" onClick={() => toggleWrap('`', 'code')}>
          <Code className="h-4 w-4" />
        </Btn>
        <Sep />
        <Btn title="Link" onClick={addLink}>
          <LinkIcon className="h-4 w-4" />
        </Btn>
        <Btn title="Image" onClick={addImage}>
          <ImageIcon className="h-4 w-4" />
        </Btn>
        <Btn title="Bulleted list" onClick={() => prefixLines(() => '- ')}>
          <List className="h-4 w-4" />
        </Btn>
        <Btn title="Numbered list" onClick={() => prefixLines((i) => `${i + 1}. `)}>
          <ListOrdered className="h-4 w-4" />
        </Btn>
        <Btn title="Quote" onClick={() => prefixLines(() => '> ')}>
          <Quote className="h-4 w-4" />
        </Btn>
        <Btn title="Table" onClick={() => insertAtCursor('\n| Column A | Column B |\n| --- | --- |\n| cell | cell |\n')}>
          <Table className="h-4 w-4" />
        </Btn>
        <Btn title="Divider" onClick={() => insertAtCursor('\n\n---\n\n')}>
          <Minus className="h-4 w-4" />
        </Btn>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={onPaste}
        spellCheck={false}
        placeholder="Write or paste Markdown… (paste an image to embed it)"
        style={{ minHeight }}
        className="w-full flex-1 resize-y rounded-b-lg bg-transparent p-3 font-mono text-sm leading-6 outline-none"
      />
    </div>
  );
}

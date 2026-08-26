'use client';

import { useRef } from 'react';
import {
  Bold,
  Code,
  CodeSquare,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
  Table,
} from 'lucide-react';
import { DOCUMENT_LIMITS } from '@readmesh/shared';
import { cn } from '@/lib/utils';
import { useDialog } from '@/providers/dialog-provider';

/** Matches an unordered, ordered or task-list marker at the head of a line. */
const LIST_ITEM_RE = /^(\s*)([-*+]|\d+\.)(\s+)(\[[ xX]\]\s+)?(.*)$/;
const INDENT = '  ';

export function MarkdownEditor({
  value,
  onChange,
  className,
  minHeight = '24rem',
  allowImagePaste = true,
  maxLength = DOCUMENT_LIMITS.CONTENT_MAX,
}) {
  const ref = useRef(null);
  const dialog = useDialog();

  /**
   * Applies an edit through the browser's own editing pipeline.
   *
   * Assigning to the textarea's value (which is what a plain `onChange` does) does
   * not create a native undo entry, so Ctrl+Z would replay whatever the user last
   * *typed* — in practice it re-inserted stale text and corrupted the document.
   * `insertText` goes through the same path as typing, keeping undo and redo honest.
   * `execCommand` is formally deprecated but remains the only cross-browser way to
   * write to a textarea undoably; the direct write stays as a fallback.
   */
  const applyEdit = (start, end, text, selStart = start + text.length, selEnd = selStart) => {
    const ta = ref.current;
    if (!ta) return;

    ta.focus();
    ta.setSelectionRange(start, end);

    let inserted = false;
    try {
      inserted = document.execCommand('insertText', false, text);
    } catch {
      inserted = false;
    }
    if (!inserted) {
      onChange(value.slice(0, start) + text + value.slice(end));
    }

    // Runs after React has committed the new value, so the offsets land on the
    // text the user is actually looking at.
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(selStart, selEnd);
    });
  };

  const toggleWrap = (marker, placeholder = '') => {
    const ta = ref.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const sel = value.slice(s, e);
    const m = marker.length;

    // Already wrapped inside the selection — unwrap.
    if (sel.length >= m * 2 && sel.startsWith(marker) && sel.endsWith(marker)) {
      const inner = sel.slice(m, sel.length - m);
      applyEdit(s, e, inner, s, s + inner.length);
      return;
    }
    // Wrapped just outside the selection — unwrap those too.
    if (s >= m && value.slice(s - m, s) === marker && value.slice(e, e + m) === marker) {
      applyEdit(s - m, e + m, sel, s - m, s - m + sel.length);
      return;
    }

    const text = sel || placeholder;
    applyEdit(s, e, `${marker}${text}${marker}`, s + m, s + m + text.length);
  };

  const toggleLinePrefix = (makePrefix, detectRe, stripRe = detectRe) => {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: start, selectionEnd: end } = ta;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const block = value.slice(lineStart, end);
    const lines = block.split('\n');
    const meaningful = lines.filter((line) => line.trim().length > 0);
    const allPrefixed = meaningful.length > 0 && meaningful.every((line) => detectRe.test(line));

    let n = 0;
    const replaced = lines
      .map((line) => {
        const bare = line.replace(stripRe, '');
        if (allPrefixed || line.trim().length === 0) return bare;
        const out = makePrefix(n) + bare;
        n += 1;
        return out;
      })
      .join('\n');

    applyEdit(lineStart, end, replaced, lineStart, lineStart + replaced.length);
  };

  const insertAtCursor = (text) => {
    const ta = ref.current;
    if (!ta) return;
    applyEdit(ta.selectionStart, ta.selectionEnd, text);
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
        {
          name: 'url',
          label: 'URL',
          defaultValue: 'https://',
          placeholder: 'https://',
          required: true,
        },
      ],
    });
    if (!result?.url) return;
    applyEdit(start, end, `[${result.text || result.url}](${result.url})`);
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
        {
          name: 'url',
          label: 'Image URL',
          defaultValue: 'https://',
          placeholder: 'https://',
          required: true,
        },
        { name: 'alt', label: 'Alt text (optional)', placeholder: 'description' },
      ],
    });
    if (!result?.url) return;
    applyEdit(start, end, `![${result.alt || ''}](${result.url})`);
  };

  const onPaste = (e) => {
    if (!allowImagePaste) return;
    const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
    const file = item?.getAsFile();
    if (!file) return;
    e.preventDefault();

    const reader = new FileReader();
    reader.onload = () => {
      const markdown = `![pasted image](${reader.result})`;
      // A base64 image is bulky; refuse rather than silently produce a document the
      // server will reject on save.
      if (value.length + markdown.length > maxLength) {
        dialog.alert({
          title: 'Image is too large',
          description:
            'Embedding this image would push the document past its size limit. Host it somewhere and insert the URL instead.',
        });
        return;
      }
      insertAtCursor(markdown);
    };
    reader.readAsDataURL(file);
  };

  /** Continues a list on Enter, and ends it when the item was left empty. */
  const handleEnter = (event) => {
    const ta = ref.current;
    if (!ta || ta.selectionStart !== ta.selectionEnd) return false;

    const caret = ta.selectionStart;
    const lineStart = value.lastIndexOf('\n', caret - 1) + 1;
    const line = value.slice(lineStart, caret);
    const match = LIST_ITEM_RE.exec(line);
    if (!match) return false;

    const [, indent, marker, gap, task, body] = match;

    // Enter on an empty item closes the list instead of adding another bullet.
    if (!body.trim()) {
      event.preventDefault();
      applyEdit(lineStart, caret, '', lineStart, lineStart);
      return true;
    }

    const nextMarker = /^\d+\.$/.test(marker)
      ? `${Number.parseInt(marker, 10) + 1}.`
      : marker;
    // A checked box should not carry its tick to the new item.
    const nextTask = task ? '[ ] ' : '';
    const insertion = `\n${indent}${nextMarker}${gap}${nextTask}`;

    event.preventDefault();
    applyEdit(caret, caret, insertion);
    return true;
  };

  /** Tab indents rather than escaping the field, Shift+Tab outdents. */
  const handleTab = (event) => {
    const ta = ref.current;
    if (!ta) return;
    event.preventDefault();

    const { selectionStart: start, selectionEnd: end } = ta;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const multiline = value.slice(start, end).includes('\n');

    if (!multiline && !event.shiftKey) {
      applyEdit(start, end, INDENT);
      return;
    }

    const block = value.slice(lineStart, end);
    const shifted = block
      .split('\n')
      .map((line) =>
        event.shiftKey
          ? line.replace(new RegExp(`^( {1,${INDENT.length}}|\t)`), '')
          : INDENT + line,
      )
      .join('\n');

    applyEdit(lineStart, end, shifted, lineStart, lineStart + shifted.length);
  };

  const onKeyDown = (event) => {
    const mod = event.metaKey || event.ctrlKey;

    if (mod && !event.altKey) {
      const key = event.key.toLowerCase();
      if (key === 'b') {
        event.preventDefault();
        toggleWrap('**', 'bold');
        return;
      }
      if (key === 'i') {
        event.preventDefault();
        toggleWrap('*', 'italic');
        return;
      }
      if (key === 'k') {
        event.preventDefault();
        addLink();
        return;
      }
      if (key === 'e') {
        event.preventDefault();
        toggleWrap('`', 'code');
        return;
      }
    }

    if (event.key === 'Enter' && !event.shiftKey && !mod) {
      handleEnter(event);
      return;
    }
    if (event.key === 'Tab') handleTab(event);
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
  const Sep = () => <span className="mx-1 h-5 w-px bg-border" aria-hidden />;

  const over = value.length > maxLength;

  return (
    <div className={cn('flex flex-col rounded-lg border border-border', className)}>
      <div
        role="toolbar"
        aria-label="Formatting"
        className="flex flex-wrap items-center gap-0.5 border-b border-border px-1.5 py-1"
      >
        <Btn title="Heading 1" onClick={() => toggleLinePrefix(() => '# ', /^# /, /^#{1,6} /)}>
          <Heading1 className="h-4 w-4" />
        </Btn>
        <Btn title="Heading 2" onClick={() => toggleLinePrefix(() => '## ', /^## /, /^#{1,6} /)}>
          <Heading2 className="h-4 w-4" />
        </Btn>
        <Btn title="Heading 3" onClick={() => toggleLinePrefix(() => '### ', /^### /, /^#{1,6} /)}>
          <Heading3 className="h-4 w-4" />
        </Btn>
        <Sep />
        <Btn title="Bold (Ctrl+B)" onClick={() => toggleWrap('**', 'bold')}>
          <Bold className="h-4 w-4" />
        </Btn>
        <Btn title="Italic (Ctrl+I)" onClick={() => toggleWrap('*', 'italic')}>
          <Italic className="h-4 w-4" />
        </Btn>
        <Btn title="Strikethrough" onClick={() => toggleWrap('~~', 'text')}>
          <Strikethrough className="h-4 w-4" />
        </Btn>
        <Btn title="Inline code (Ctrl+E)" onClick={() => toggleWrap('`', 'code')}>
          <Code className="h-4 w-4" />
        </Btn>
        <Btn title="Code block" onClick={() => insertAtCursor('\n```js\n\n```\n')}>
          <CodeSquare className="h-4 w-4" />
        </Btn>
        <Sep />
        <Btn title="Link (Ctrl+K)" onClick={addLink}>
          <LinkIcon className="h-4 w-4" />
        </Btn>
        <Btn title="Image" onClick={addImage}>
          <ImageIcon className="h-4 w-4" />
        </Btn>
        <Btn
          title="Bulleted list"
          onClick={() => toggleLinePrefix(() => '- ', /^[-*+] /, /^([-*+] |\d+\. )/)}
        >
          <List className="h-4 w-4" />
        </Btn>
        <Btn
          title="Numbered list"
          onClick={() => toggleLinePrefix((i) => `${i + 1}. `, /^\d+\. /, /^([-*+] |\d+\. )/)}
        >
          <ListOrdered className="h-4 w-4" />
        </Btn>
        <Btn
          title="Task list"
          onClick={() =>
            toggleLinePrefix(() => '- [ ] ', /^[-*+] \[[ xX]\] /, /^([-*+] (\[[ xX]\] )?|\d+\. )/)
          }
        >
          <ListChecks className="h-4 w-4" />
        </Btn>
        <Btn title="Quote" onClick={() => toggleLinePrefix(() => '> ', /^> ?/)}>
          <Quote className="h-4 w-4" />
        </Btn>
        <Btn
          title="Table"
          onClick={() =>
            insertAtCursor('\n| Column A | Column B |\n| --- | --- |\n| cell | cell |\n')
          }
        >
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
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        spellCheck={false}
        aria-label="Markdown source"
        aria-invalid={over || undefined}
        placeholder="Write or paste Markdown… (paste an image to embed it)"
        style={{ minHeight }}
        className="w-full flex-1 resize-y rounded-b-lg bg-transparent p-3 font-mono text-sm leading-6 outline-none"
      />

      {over && (
        <p
          role="alert"
          className="shrink-0 border-t border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs text-destructive"
        >
          This document is {(value.length - maxLength).toLocaleString()} characters over the{' '}
          {maxLength.toLocaleString()} limit and will not save until it is shorter.
        </p>
      )}
    </div>
  );
}

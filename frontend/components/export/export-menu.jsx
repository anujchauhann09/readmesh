'use client';

import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { exportMarkdown, exportHtml, exportPdf } from '@/lib/export/export-doc';

const isDark = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');


export function ExportMenu({ getMarkdown, getRenderedEl, title = 'document', disabled }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm outline-none hover:bg-accent focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-40"
      >
        <Download className="h-4 w-4" />
        Export
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => exportMarkdown(getMarkdown(), title)}>
          Markdown (.md)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => exportHtml(getRenderedEl(), { title, dark: isDark() })}>
          HTML (.html)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => exportPdf(getRenderedEl(), { title, dark: isDark() })}>
          PDF (print)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

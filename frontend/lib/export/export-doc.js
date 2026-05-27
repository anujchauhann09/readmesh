// Client-side document export. Markdown is downloaded as-is; HTML/PDF are built
// from the *rendered* preview DOM so Shiki code, KaTeX math and callouts come
// through exactly as shown. PDF uses the browser's own print-to-PDF (vector,
// zero-dependency) per the chosen strategy.

const escapeHtml = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const slugifyName = (name) =>
  (name || 'document').replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '') || 'document';

const triggerDownload = (filename, content, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/** Concatenates the text of every readable (same-origin) stylesheet on the page. */
const collectCss = () => {
  let css = '';
  for (const sheet of Array.from(document.styleSheets)) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin sheet — not readable, skip
    }
    if (!rules) continue;
    for (const rule of Array.from(rules)) css += `${rule.cssText}\n`;
  }
  return css;
};

const PRINT_CSS = `
@page { margin: 1.6cm; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
body { margin: 0 auto; padding: 2.5rem 1.5rem; max-width: 56rem; }
`;

/**
 * Wraps a rendered `.markdown-body` element in a self-contained HTML document,
 * inlining the app's stylesheets (Tailwind + markdown + KaTeX) and a <base> so
 * relative assets (KaTeX fonts, images) still resolve.
 */
export const buildStandaloneHtml = (renderedEl, { title = 'document', dark = false } = {}) => {
  const body = renderedEl ? renderedEl.outerHTML : '';
  return `<!doctype html>
<html lang="en"${dark ? ' class="dark"' : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<base href="${location.origin}/">
<title>${escapeHtml(title)}</title>
<style>${collectCss()}</style>
<style>${PRINT_CSS}</style>
</head>
<body>${body}</body>
</html>`;
};

export const exportMarkdown = (markdown, name = 'document') => {
  triggerDownload(`${slugifyName(name)}.md`, markdown ?? '', 'text/markdown;charset=utf-8');
};

export const exportHtml = (renderedEl, { title = 'document', dark = false } = {}) => {
  const html = buildStandaloneHtml(renderedEl, { title, dark });
  triggerDownload(`${slugifyName(title)}.html`, html, 'text/html;charset=utf-8');
};

export const exportPdf = (renderedEl, { title = 'document', dark = false } = {}) => {
  const win = window.open('', '_blank');
  if (!win) {
    // Popup blocked — fall back to HTML download the user can print.
    exportHtml(renderedEl, { title, dark });
    return false;
  }
  const html = buildStandaloneHtml(renderedEl, { title, dark });
  win.document.open();
  win.document.write(
    `${html}<script>window.addEventListener('load',function(){setTimeout(function(){window.focus();window.print();},400);});<\/script>`,
  );
  win.document.close();
  return true;
};

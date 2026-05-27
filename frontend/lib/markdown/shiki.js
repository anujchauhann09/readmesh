const THEME_MAP = {
  light: 'github-light',
  dark: 'github-dark',
  github: 'github-light',
  dracula: 'dracula',
  nord: 'nord',
  vscode: 'dark-plus',
};

const SHIKI_THEMES = ['github-light', 'github-dark', 'dracula', 'nord', 'dark-plus'];

const SHIKI_LANGS = [
  'javascript', 'typescript', 'jsx', 'tsx', 'json', 'json5',
  'bash', 'python', 'go', 'rust', 'java', 'kotlin',
  'c', 'cpp', 'csharp', 'php', 'ruby', 'swift',
  'css', 'scss', 'html', 'xml', 'yaml', 'toml', 'ini',
  'markdown', 'sql', 'graphql', 'dockerfile', 'diff', 'http',
];

let highlighterPromise;

const getHighlighter = async () => {
  if (!highlighterPromise) {
    highlighterPromise = import('shiki').then(({ getSingletonHighlighter }) =>
      getSingletonHighlighter({ themes: SHIKI_THEMES, langs: SHIKI_LANGS }),
    );
  }
  return highlighterPromise;
};

export const shikiThemeFor = (appTheme, resolved) =>
  THEME_MAP[appTheme] ?? THEME_MAP[resolved] ?? 'github-dark';

export const highlightCode = async (code, lang, theme) => {
  const hl = await getHighlighter();
  try {
    return hl.codeToHtml(code, { lang: lang || 'text', theme });
  } catch {
    return hl.codeToHtml(code, { lang: 'text', theme });
  }
};

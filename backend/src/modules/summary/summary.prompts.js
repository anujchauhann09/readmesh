const TLDR_SCHEMA = {
  type: 'OBJECT',
  properties: {
    tldr: { type: 'STRING' },
    whatItDoes: { type: 'STRING' },
    whoItsFor: { type: 'STRING' },
    howToRun: { type: 'ARRAY', items: { type: 'STRING' } },
    keyCommands: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          command: { type: 'STRING' },
          description: { type: 'STRING' },
        },
        required: ['command', 'description'],
      },
    },
    techStack: { type: 'ARRAY', items: { type: 'STRING' } },
    highlights: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['tldr', 'whatItDoes', 'whoItsFor', 'howToRun', 'keyCommands', 'highlights'],
};

const COMMANDS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    commands: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          command: { type: 'STRING' },
          description: { type: 'STRING' },
          category: {
            type: 'STRING',
            enum: ['install', 'run', 'build', 'test', 'deploy', 'other'],
          },
        },
        required: ['command', 'description', 'category'],
      },
    },
  },
  required: ['commands'],
};

const GROUNDING =
  'Base your answer strictly on the documentation provided. Do not invent features, ' +
  'commands, or facts that are not present or clearly implied. If information is missing, ' +
  'say so briefly rather than guessing.';

export const tldr = (content, repoName) => ({
  system:
    'You are a senior engineer who writes crisp, accurate summaries of software ' +
    `project documentation for busy developers. ${GROUNDING}`,
  prompt:
    `Summarize the following ${repoName ? `"${repoName}" ` : ''}project documentation.\n` +
    'Produce: a 2-3 sentence TL;DR; what it does; who it is for; ordered steps to run it ' +
    'locally; the most important commands with one-line descriptions; the detected tech ' +
    'stack; and a few notable highlights. Keep every field concise.\n\n' +
    `--- DOCUMENTATION START ---\n${content}\n--- DOCUMENTATION END ---`,
  json: true,
  schema: TLDR_SCHEMA,
  temperature: 0.2,
  maxOutputTokens: 2048,
});

export const commands = (content) => ({
  system:
    'You extract runnable shell/CLI commands from project documentation. ' +
    `${GROUNDING} Only include commands that actually appear in the documentation.`,
  prompt:
    'Extract every distinct, runnable command from the documentation below. For each, give ' +
    'the exact command, a short description of what it does, and a category ' +
    '(install, run, build, test, deploy, or other). De-duplicate near-identical commands.\n\n' +
    `--- DOCUMENTATION START ---\n${content}\n--- DOCUMENTATION END ---`,
  json: true,
  schema: COMMANDS_SCHEMA,
  temperature: 0.1,
  maxOutputTokens: 2048,
});

export const beginner = (content) => ({
  system:
    'You rewrite technical documentation so a complete beginner can understand it, ' +
    `while staying faithful to the original meaning. ${GROUNDING}`,
  prompt:
    'Rewrite the documentation below in simple, beginner-friendly English. Explain jargon in ' +
    'plain terms, keep a clear Markdown structure (headings, lists, fenced code blocks), and ' +
    'preserve all commands, file names, and code exactly. Do not add information that is not ' +
    'in the original. Return only the rewritten Markdown, with no preamble.\n\n' +
    `--- DOCUMENTATION START ---\n${content}\n--- DOCUMENTATION END ---`,
  temperature: 0.3,
  maxOutputTokens: 8192,
});

export const translate = (content, languageLabel) => ({
  system:
    `You are a professional technical translator. You translate documentation into ${languageLabel} ` +
    'accurately and naturally, preserving technical precision.',
  prompt:
    `Translate the Markdown documentation below into ${languageLabel}. Translate prose only: keep ` +
    'fenced and inline code, commands, URLs, file paths, and identifiers exactly as they are. ' +
    'Preserve the Markdown structure. Return only the translated Markdown, with no preamble.\n\n' +
    `--- DOCUMENTATION START ---\n${content}\n--- DOCUMENTATION END ---`,
  temperature: 0.3,
  maxOutputTokens: 8192,
});

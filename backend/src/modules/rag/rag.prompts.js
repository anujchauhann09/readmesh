export const buildAnswerPrompt = (question, contexts) => {
  const blocks = contexts
    .map(
      (c) =>
        `[${c.sourceNum}] (${c.path}${c.heading ? ` › ${c.heading}` : ''})\n${c.text}`,
    )
    .join('\n\n---\n\n');

  return {
    system:
      'You are a documentation assistant for a specific GitHub repository. Answer the ' +
      "user's question using ONLY the numbered context excerpts from that repo's docs. " +
      'When you use a fact from an excerpt, cite it inline with its bracket number, e.g. [1] ' +
      'or [2][3]. Use only the numbers shown on the excerpts. If the answer is not in the ' +
      'context, say you could not find it in the documentation — do not invent commands, ' +
      'env vars, or behavior. Prefer concrete commands and file names. Use Markdown.',
    prompt:
      `Question: ${question}\n\n` +
      `Context excerpts from the repository documentation:\n\n${blocks}\n\n` +
      'Answer the question, citing sources by their bracket number.',
    temperature: 0.2,
    maxOutputTokens: 1536,
  };
};

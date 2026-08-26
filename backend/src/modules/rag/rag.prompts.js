const HISTORY_CHAR_BUDGET = 2000;

/**
 * Renders prior turns oldest-last within a character budget, so a long thread
 * degrades by dropping its oldest turns rather than by crowding out the retrieved
 * context — which is what actually grounds the answer.
 */
const renderHistory = (history) => {
  if (!history?.length) return '';

  const lines = [];
  let budget = HISTORY_CHAR_BUDGET;

  for (let i = history.length - 1; i >= 0; i -= 1) {
    const turn = history[i];
    const line = `${turn.role === 'ASSISTANT' ? 'Assistant' : 'User'}: ${turn.content}`;
    if (line.length > budget) break;
    budget -= line.length;
    lines.unshift(line);
  }

  return lines.length ? `Earlier in this conversation:\n${lines.join('\n')}\n\n` : '';
};

export const buildAnswerPrompt = (question, contexts, history = []) => {
  const blocks = contexts
    .map((c) => `[${c.sourceNum}] (${c.path}${c.heading ? ` › ${c.heading}` : ''})\n${c.text}`)
    .join('\n\n---\n\n');

  return {
    system:
      'You are a documentation assistant for a specific GitHub repository. Answer the ' +
      "user's question using ONLY the numbered context excerpts from that repo's docs. " +
      'When you use a fact from an excerpt, cite it inline with its bracket number, e.g. [1] ' +
      'or [2][3]. Use only the numbers shown on the excerpts. If the answer is not in the ' +
      'context, say you could not find it in the documentation — do not invent commands, ' +
      'env vars, or behavior. Earlier conversation turns are background for resolving ' +
      'follow-up references only; never treat them as a source of repository facts. ' +
      'Prefer concrete commands and file names. Use Markdown.',
    prompt:
      renderHistory(history) +
      `Question: ${question}\n\n` +
      `Context excerpts from the repository documentation:\n\n${blocks}\n\n` +
      'Answer the question, citing sources by their bracket number.',
    temperature: 0.2,
    maxOutputTokens: 1536,
  };
};

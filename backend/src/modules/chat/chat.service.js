import { ApiError } from '../../common/ApiError.js';
import { requireInternalUserId } from '../user/user.access.js';
import { toPage } from '../../utils/pagination.js';
import * as repo from './chat.repository.js';
import { toPublicConversation, toPublicMessage } from './chat.mapper.js';

const TITLE_MAX = 120;
// Enough for follow-ups ("and how do I deploy it?") without letting an old thread
// crowd the retrieved context out of the prompt.
const HISTORY_TURNS = 6;
const MESSAGE_PAGE = 200;

/** First question doubles as the thread title, the way every chat UI does it. */
const deriveTitle = (question) => {
  const clean = question.trim().replace(/\s+/g, ' ');
  return clean.length <= TITLE_MAX ? clean : `${clean.slice(0, TITLE_MAX - 1)}…`;
};

export const listConversations = async (publicUserId, { owner, name, ref, limit, cursor }) => {
  const userId = await requireInternalUserId(publicUserId);
  const rows = await repo.listConversations(
    userId,
    { repoOwner: owner, repoName: name, repoRef: ref },
    { limit, cursor },
  );
  const { items, meta } = toPage(rows, { limit });
  return { conversations: items.map(toPublicConversation), meta };
};

export const getConversation = async (publicUserId, publicId) => {
  const userId = await requireInternalUserId(publicUserId);
  const found = await repo.getOwnedWithMessages(publicId, userId, { messageLimit: MESSAGE_PAGE });
  if (!found) throw ApiError.notFound('Conversation not found');
  return toPublicConversation(found);
};

export const deleteConversation = async (publicUserId, publicId) => {
  const userId = await requireInternalUserId(publicUserId);
  const removed = await repo.deleteOwned(publicId, userId);
  if (!removed) throw ApiError.notFound('Conversation not found');
};

/**
 * Resolves the thread a question belongs to, creating one on first ask.
 *
 * Returns the internal id and the prior turns, so the ask path can build its
 * prompt and persist the exchange without a second ownership check.
 */
export const openThread = async (publicUserId, { conversationId, repo: coords, question }) => {
  const userId = await requireInternalUserId(publicUserId);

  if (!conversationId) {
    const created = await repo.createConversation(userId, {
      repoOwner: coords.owner,
      repoName: coords.name,
      repoRef: coords.ref,
      title: deriveTitle(question),
    });
    const found = await repo.findOwned(created.publicId, userId);
    return { id: found.id, conversation: toPublicConversation(found), history: [] };
  }

  const existing = await repo.findOwned(conversationId, userId);
  if (!existing) throw ApiError.notFound('Conversation not found');

  const history = await repo.recentMessages(existing.id, HISTORY_TURNS);
  return { id: existing.id, conversation: toPublicConversation(existing), history };
};

export const recordTurn = async (conversationId, { question, answer, sources }) => {
  await repo.appendMessage(conversationId, { role: 'USER', content: question });
  const assistant = await repo.appendMessage(conversationId, {
    role: 'ASSISTANT',
    content: answer,
    sources: sources ?? undefined,
  });
  return toPublicMessage(assistant);
};

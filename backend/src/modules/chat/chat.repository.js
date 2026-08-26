import { prisma } from '../../lib/prisma.js';
import { toPrismaPage } from '../../utils/pagination.js';

const CONVERSATION = {
  publicId: true,
  title: true,
  repoOwner: true,
  repoName: true,
  repoRef: true,
  createdAt: true,
  updatedAt: true,
};

const MESSAGE = {
  publicId: true,
  role: true,
  content: true,
  sources: true,
  createdAt: true,
};

export const createConversation = (userId, data) =>
  prisma.conversation.create({ data: { ...data, userId }, select: CONVERSATION });

export const listConversations = (userId, { repoOwner, repoName, repoRef }, page) =>
  prisma.conversation.findMany({
    where: {
      userId,
      ...(repoOwner && { repoOwner }),
      ...(repoName && { repoName }),
      ...(repoRef && { repoRef }),
    },
    select: CONVERSATION,
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    ...toPrismaPage(page),
  });

/** Conversation plus its messages, oldest first, for restoring a thread. */
export const getOwnedWithMessages = (publicId, userId, { messageLimit }) =>
  prisma.conversation.findFirst({
    where: { publicId, userId },
    select: {
      ...CONVERSATION,
      messages: { select: MESSAGE, orderBy: { createdAt: 'asc' }, take: messageLimit },
    },
  });

/** Internal id + coordinates, for the append path that must not re-read messages. */
export const findOwned = (publicId, userId) =>
  prisma.conversation.findFirst({
    where: { publicId, userId },
    select: { id: true, ...CONVERSATION },
  });

/** The most recent turns, returned oldest-first for prompt rendering. */
export const recentMessages = async (conversationId, take) => {
  const rows = await prisma.chatMessage.findMany({
    where: { conversationId },
    select: MESSAGE,
    orderBy: { createdAt: 'desc' },
    take,
  });
  return rows.reverse();
};

/**
 * Appends a turn and bumps the conversation's `updatedAt` in one transaction, so
 * the thread list ordering can never disagree with the messages it contains.
 */
export const appendMessage = (conversationId, message) =>
  prisma.$transaction(async (tx) => {
    const created = await tx.chatMessage.create({
      data: { ...message, conversationId },
      select: MESSAGE,
    });
    await tx.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    return created;
  });

export const deleteOwned = async (publicId, userId) => {
  const result = await prisma.conversation.deleteMany({ where: { publicId, userId } });
  return result.count > 0;
};

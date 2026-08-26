import { Router } from 'express';
import { ROUTES } from '@readmesh/shared';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { listConversationsSchema, conversationIdSchema } from './chat.dto.js';
import { listConversations, getConversation, removeConversation } from './chat.controller.js';

const { CONVERSATIONS, CONVERSATION_BY_ID } = ROUTES.CHAT;

export const chatRouter = Router();

chatRouter.use(authenticate);

chatRouter.get(CONVERSATIONS, validate(listConversationsSchema), listConversations);
chatRouter.get(CONVERSATION_BY_ID, validate(conversationIdSchema), getConversation);
chatRouter.delete(CONVERSATION_BY_ID, validate(conversationIdSchema), removeConversation);

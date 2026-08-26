import { asyncHandler } from '../../common/asyncHandler.js';
import { sendSuccess } from '../../common/ApiResponse.js';
import * as chatService from './chat.service.js';

export const listConversations = asyncHandler(async (req, res) => {
  const { conversations, meta } = await chatService.listConversations(
    req.user.publicId,
    req.validated.query,
  );
  sendSuccess(res, { data: { conversations }, meta });
});

export const getConversation = asyncHandler(async (req, res) => {
  const conversation = await chatService.getConversation(
    req.user.publicId,
    req.validated.params.id,
  );
  sendSuccess(res, { data: { conversation } });
});

export const removeConversation = asyncHandler(async (req, res) => {
  await chatService.deleteConversation(req.user.publicId, req.validated.params.id);
  sendSuccess(res, { message: 'Conversation deleted', data: null });
});

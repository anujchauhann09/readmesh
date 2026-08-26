import { ROUTES } from '@readmesh/shared';
import { apiClient } from '@/lib/api-client';
import { unwrap, unwrapAck, unwrapPage } from './envelope';

const { CHAT } = ROUTES;
const conversations = `${CHAT.BASE}${CHAT.CONVERSATIONS}`;
const byId = (id) => `${conversations}/${id}`;

export const listConversationsRequest = ({ owner, name, ref, limit } = {}) =>
  apiClient
    .get(conversations, {
      params: {
        ...(owner ? { owner } : {}),
        ...(name ? { name } : {}),
        ...(ref ? { ref } : {}),
        ...(limit ? { limit } : {}),
      },
    })
    .then(unwrapPage('conversations'));

export const getConversationRequest = (id) => apiClient.get(byId(id)).then(unwrap('conversation'));

export const deleteConversationRequest = (id) => apiClient.delete(byId(id)).then(unwrapAck);

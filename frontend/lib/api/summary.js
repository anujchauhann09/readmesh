import { ROUTES } from '@readmesh/shared';
import { apiClient } from '@/lib/api-client';

const { SUMMARY } = ROUTES;
const path = (route) => `${SUMMARY.BASE}${route}`;

const AI_TIMEOUT = 60_000;
const post = (route, payload) =>
  apiClient.post(path(route), payload, { timeout: AI_TIMEOUT }).then((r) => r.data.data);

export const tldrRequest = ({ content, repoName }) =>
  post(SUMMARY.TLDR, { content, ...(repoName ? { repoName } : {}) });

export const commandsRequest = ({ content }) => post(SUMMARY.COMMANDS, { content });

export const beginnerRequest = ({ content }) => post(SUMMARY.BEGINNER, { content });

export const translateRequest = ({ content, language }) =>
  post(SUMMARY.TRANSLATE, { content, language });

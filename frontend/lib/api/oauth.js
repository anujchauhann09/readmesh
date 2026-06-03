import { ROUTES } from '@readmesh/shared';
import { apiClient } from '@/lib/api-client';

export const oauthStartUrl = (provider) =>
  `${apiClient.defaults.baseURL}${ROUTES.OAUTH.BASE}/${provider}`;

export const oauthCallbackRequest = ({ provider, code, state }) =>
  apiClient
    .post(`${ROUTES.OAUTH.BASE}/${provider}/callback`, { code, state })
    .then((r) => r.data.data.user);

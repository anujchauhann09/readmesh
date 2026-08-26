import { ROUTES } from '@readmesh/shared';
import { apiClient, API_BASE_URL } from '@/lib/api-client';
import { unwrap } from './envelope';

const { OAUTH } = ROUTES;

/** Full URL, because starting OAuth is a browser navigation rather than an XHR. */
export const oauthStartUrl = (provider) => `${API_BASE_URL}${OAUTH.BASE}/${provider}`;

export const oauthCallbackRequest = ({ provider, code, state }) =>
  apiClient.post(`${OAUTH.BASE}/${provider}/callback`, { code, state }).then(unwrap('user'));

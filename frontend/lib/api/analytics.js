import { ROUTES } from '@readmesh/shared';
import { apiClient } from '@/lib/api-client';
import { unwrapAck, unwrapData } from './envelope';

const { ANALYTICS } = ROUTES;
const path = (route) => `${ANALYTICS.BASE}${route}`;

export const recordEventRequest = (payload) =>
  apiClient.post(path(ANALYTICS.EVENTS), payload).then(unwrapAck);

export const analyticsSummaryRequest = ({ days } = {}) =>
  apiClient.get(path(ANALYTICS.SUMMARY), { params: { ...(days ? { days } : {}) } }).then(unwrapData);

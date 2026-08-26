'use client';

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { recordEventRequest, analyticsSummaryRequest } from '@/lib/api/analytics';

/**
 * Records a product event.
 *
 * Deliberately fire-and-forget and error-swallowing: analytics is the least
 * important thing on any screen, and a failed beacon must never interrupt reading,
 * summarising, or annotating.
 */
export function useTrackEvent() {
  return useCallback((type, { owner, name, path } = {}) => {
    recordEventRequest({
      type,
      ...(owner ? { owner } : {}),
      ...(name ? { name } : {}),
      ...(path ? { path } : {}),
    }).catch(() => {});
  }, []);
}

export function useAnalyticsSummary({ days = 30 } = {}) {
  const query = useQuery({
    queryKey: ['analytics', 'summary', days],
    queryFn: () => analyticsSummaryRequest({ days }),
    staleTime: 5 * 60 * 1000,
  });

  return { summary: query.data ?? null, isLoading: query.isPending };
}

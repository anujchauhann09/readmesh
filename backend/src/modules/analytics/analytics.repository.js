import { prisma } from '../../lib/prisma.js';

export const record = (userId, event) =>
  prisma.analyticsEvent.create({ data: { ...event, userId }, select: { id: true } });

export const countsByType = (userId, since) =>
  prisma.analyticsEvent.groupBy({
    by: ['type'],
    where: { userId, createdAt: { gte: since } },
    _count: { _all: true },
  });

/** Most-visited repositories in the window, for the "jump back in" rail. */
export const topRepos = (userId, since, take) =>
  prisma.analyticsEvent.groupBy({
    by: ['repoOwner', 'repoName'],
    where: { userId, createdAt: { gte: since }, repoOwner: { not: null }, repoName: { not: null } },
    // Counted on a grouped, non-null column so the aggregate can also be the
    // sort key — Prisma only orders by a field present in `_count`.
    _count: { repoOwner: true },
    _max: { createdAt: true },
    orderBy: { _count: { repoOwner: 'desc' } },
    take,
  });

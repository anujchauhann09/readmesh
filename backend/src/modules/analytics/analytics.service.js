import { requireInternalUserId } from '../user/user.access.js';
import * as repo from './analytics.repository.js';

const TOP_REPO_LIMIT = 5;

/**
 * Product analytics, scoped to the signed-in user and deliberately narrow: an
 * event type and optional repo coordinates, no IP address and no free text. It
 * cascades away with the account, so deletion stays complete.
 */
export const recordEvent = async (publicUserId, { type, owner, name, path }) => {
  const userId = await requireInternalUserId(publicUserId);
  await repo.record(userId, {
    type,
    repoOwner: owner ?? null,
    repoName: name ?? null,
    filePath: path ?? null,
  });
};

export const getSummary = async (publicUserId, { days }) => {
  const userId = await requireInternalUserId(publicUserId);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [counts, repos] = await Promise.all([
    repo.countsByType(userId, since),
    repo.topRepos(userId, since, TOP_REPO_LIMIT),
  ]);

  return {
    windowDays: days,
    since,
    totals: Object.fromEntries(counts.map((row) => [row.type, row._count._all])),
    topRepos: repos.map((row) => ({
      owner: row.repoOwner,
      name: row.repoName,
      fullName: `${row.repoOwner}/${row.repoName}`,
      events: row._count.repoOwner,
      lastSeenAt: row._max.createdAt,
    })),
  };
};

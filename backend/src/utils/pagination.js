import { PAGINATION } from '@readmesh/shared';
import { z } from 'zod';

/**
 * Cursor pagination shared by every collection endpoint.
 *
 * The cursor is the opaque `publicId` of the last row from the previous page, so
 * it stays stable while rows are inserted — unlike an offset. Endpoints return a
 * plain array plus `meta`, so a caller that ignores paging still gets a usable
 * (now bounded) first page instead of the whole table.
 */
export const paginationQuery = {
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(PAGINATION.MAX_LIMIT)
    .default(PAGINATION.DEFAULT_LIMIT),
  cursor: z.string().uuid('Invalid cursor').optional(),
};

/**
 * Turns a page request into Prisma `take`/`cursor`/`skip` arguments. One extra
 * row is fetched so `hasMore` is known without a second COUNT query.
 */
export const toPrismaPage = ({ limit, cursor }) => ({
  take: limit + 1,
  ...(cursor && { cursor: { publicId: cursor }, skip: 1 }),
});

/** Splits the over-fetched row off and reports the cursor for the next page. */
export const toPage = (rows, { limit }) => {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return {
    items,
    meta: {
      limit,
      count: items.length,
      hasMore,
      nextCursor: hasMore ? items[items.length - 1].publicId : null,
    },
  };
};

import { logger } from '../utils/logger.js';
import { deleteExpiredTokens } from '../modules/auth/auth.repository.js';

const INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours
const FIRST_RUN_DELAY_MS = 30 * 1000; // let the process finish booting first

/**
 * Prunes expired refresh and password-reset tokens.
 *
 * Both tables are append-heavy and nothing ever removed the dead rows, so they
 * grew without bound — every sign-in and every rotation left one behind. Expired
 * rows carry no authority, so deleting them is safe; the self-referencing
 * `replacedById` link is ON DELETE SET NULL, so pruning a chain cannot orphan a
 * live token.
 *
 * Deliberately an in-process timer rather than a separate worker: the deployment
 * target is a single Render instance and a cron service would be another moving
 * part to operate.
 */
const runOnce = async () => {
  try {
    const removed = await deleteExpiredTokens();
    if (removed.refreshTokens || removed.resetTokens) {
      logger.info(removed, 'Pruned expired tokens');
    }
  } catch (err) {
    logger.error({ err }, 'Token cleanup failed');
  }
};

export const startTokenCleanup = () => {
  const first = setTimeout(runOnce, FIRST_RUN_DELAY_MS);
  const repeating = setInterval(runOnce, INTERVAL_MS);
  // Unref'd so the timers never hold the process open during shutdown.
  first.unref();
  repeating.unref();

  return () => {
    clearTimeout(first);
    clearInterval(repeating);
  };
};

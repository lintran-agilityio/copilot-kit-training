/**
 * Stop timing contract (server latch + client silent-409).
 *
 * One shared clock for:
 * - Server stop latch (`apps/agent` ag-ui): abort FE-tool / chain follow-ups
 *   after Stop. New user turns still bypass the latch via message-id check.
 * - Client recent-stop window (`apps/web` agent-run): silence Intelligence 409
 *   while the platform thread lock may still be held.
 *
 * Must stay >= Intelligence platform lock TTL. Do not split these back into
 * independent locals — tuning one side alone recreates "Stop needs a second
 * click" or noisy post-Stop 409s.
 */

/** Intelligence platform thread-lock TTL (observed). */
export const INTELLIGENCE_THREAD_LOCK_TTL_MS = 20_000;

/**
 * Shared Stop TTL for server latch and client silent-409 window.
 * Must be >= {@link INTELLIGENCE_THREAD_LOCK_TTL_MS}.
 */
export const STOP_RECENT_TTL_MS = INTELLIGENCE_THREAD_LOCK_TTL_MS;

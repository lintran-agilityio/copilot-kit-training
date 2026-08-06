/**
 * AG-UI bridge layer (CopilotKit Runtime ↔ Mastra).
 *
 * Stop (AbortSignal) ownership in this stack:
 * 1. CopilotKit UI — stopAgent / HTTP /stop → idle chat, no new tokens
 * 2. This layer — AbortController per run; inject abortSignal into Mastra
 *    stream(); abortRun + stop latch kill the run chain (Intelligence WS,
 *    not a plain SSE close)
 * 3. Mastra — honors abortSignal between steps (prepareStep) and in tools
 * 4. Tools / Nest fetch — throwIfAborted + fetch({ signal }) before side effects
 *
 * Owns: stream adaptation, abortSignal injection, stop latch, tripwire,
 * and transcript/stream compatibility (`stream-patch`) so the UI does not
 * become the long-term home for memory/replay data fixes.
 * Does not own: prompts, Nest domain logic, CopilotKit presentation state
 * (animations, optimistic UI, Stop dismiss/dim of incomplete bubbles).
 *
 * Stop latch TTL is `STOP_RECENT_TTL_MS` from `@repo/constants` (shared with
 * the web client silent-409 window).
 */

export {
  clearStopLatch,
  getStopLatch,
  isStopLatchLive,
  latchThreadStop,
  noteThreadUserMessage,
  STOP_LATCH_TTL_MS,
  type StopLatchEntry,
} from "./stop-latch";

export {
  enableProcessorTripwireHandling,
  excludeBlockedUserMessages,
  excludeResolvedToolCalls,
  isBlockedUserMessage,
  selectLatestUserTurn,
} from "./stream-patch";

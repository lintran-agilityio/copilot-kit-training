/**
 * AG-UI bridge layer.
 *
 * Owns: stream adaptation, stop latch, tripwire compatibility.
 * Does not own: prompts, Mastra tools, Nest domain logic.
 *
 * Flow: stream patch → check stop latch → emit / abort events.
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

/**
 * Thread stop latch — separate from AG-UI stream patching.
 *
 * A visible "generation" is a chain of server runs (stream end → frontend-tool
 * continuation / retry). Aborting only the active run leaves the chain alive;
 * a Stop in the gap between runs aborts nothing. While latched, non-user /
 * non-HITL-resume runs abort before they stream.
 */

export type StopLatchEntry = {
  latchedAt: number;
  stoppedUserMessageId?: string;
};

const stopLatchByThreadId = new Map<string, StopLatchEntry>();

/** Newest user message id seen per thread — identifies the turn a Stop belongs to. */
const lastUserMessageIdByThreadId = new Map<string, string>();

/** Long enough to swallow the follow-up chain, short enough not to eat a real next turn. */
export const STOP_LATCH_TTL_MS = 10_000;

/**
 * Record that the user stopped this thread.
 *
 * Must also be called for a stop that finds no active run: the visible
 * generation is a chain of runs, so a Stop often lands in the gap between two
 * of them. Without the latch, the next run in the chain starts and the chat
 * keeps generating — the "needs a second click" symptom.
 */
export const latchThreadStop = (threadId: string): void => {
  if (!threadId) {
    return;
  }

  stopLatchByThreadId.set(threadId, {
    latchedAt: Date.now(),
    stoppedUserMessageId: lastUserMessageIdByThreadId.get(threadId),
  });
};

/** Remember the latest user message id for a thread (used when latching Stop). */
export const noteThreadUserMessage = (
  threadId: string,
  messageId: string,
): void => {
  lastUserMessageIdByThreadId.set(threadId, messageId);
};

export const getStopLatch = (
  threadId: string,
): StopLatchEntry | undefined => stopLatchByThreadId.get(threadId);

export const clearStopLatch = (threadId: string): void => {
  stopLatchByThreadId.delete(threadId);
};

export const isStopLatchLive = (
  latch: StopLatchEntry | undefined,
): boolean => !!latch && Date.now() - latch.latchedAt < STOP_LATCH_TTL_MS;

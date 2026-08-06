/**
 * Thread metadata keys used by AG-UI bridge / Mastra memory side-channels.
 * Keep event/metadata string constants here — not in stream-patch logic.
 */

/** Thread.metadata key: user message ids blocked by security processors. */
export const THREAD_METADATA_BLOCKED_MESSAGE_IDS = "blockedMessageIds";

/**
 * Thread.metadata key: authoritative Booking Draft for progressive book/modify.
 * Mirrored into request context at the start of each agent run so clarification
 * turns resume the same draft without reconstructing from chat history.
 */
export const THREAD_METADATA_BOOKING_DRAFT = "bookingDraft";

/**
 * Thread.metadata key: last structured find_room filters (date/guests only).
 * Merge input for Booking Draft — never a competing stay copy.
 */
export const THREAD_METADATA_STRUCTURED_SEARCH_CONTEXT =
  "structuredSearchContext";

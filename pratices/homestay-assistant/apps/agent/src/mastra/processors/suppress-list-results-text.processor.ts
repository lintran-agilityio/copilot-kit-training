import type { ProcessOutputStreamArgs } from "@mastra/core/processors";
import type { ChunkType } from "@mastra/core/stream";

import { applyListResultsHandoffStreamFilter } from "../booking";

/**
 * After a find_room / get_bookings tool-result chunk that returned results,
 * drop later assistant text chunks in this run. Room List / bookings list
 * cards are the response even when a follow-up LLM step still runs (e.g. the
 * forced narration-only hop, or a same-turn CANCEL/MODIFY disambiguation call).
 *
 * Structural (tool name + matchCount/bookingCount) — not chat-copy matching.
 */
export class SuppressListResultsTextProcessor {
  id = "suppress-list-results-text";

  name = "Suppress List Results Text";

  async processOutputStream({
    part,
    state,
  }: ProcessOutputStreamArgs): Promise<ChunkType | null | undefined> {
    const { emit } = applyListResultsHandoffStreamFilter(part, state);
    return emit ? part : null;
  }
}

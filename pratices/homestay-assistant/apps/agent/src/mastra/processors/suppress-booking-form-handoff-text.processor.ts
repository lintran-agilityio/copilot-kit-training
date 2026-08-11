import type { ProcessOutputStreamArgs } from "@mastra/core/processors";
import type { ChunkType } from "@mastra/core/stream";

import { applyBookingFormHandoffStreamFilter } from "../booking/stop-after-booking-form";

/**
 * After a successful get_room_by_id or mutation (create/update/cancel)
 * tool-result chunk, drop later assistant text chunks in this run. That
 * prevents the AG-UI continuation bubble ("booking cancelled…") even when a
 * follow-up LLM step still runs.
 *
 * Structural (tool name + success payload) — not chat-copy matching.
 */
export class SuppressBookingFormHandoffTextProcessor {
  id = "suppress-booking-form-handoff-text";

  name = "Suppress Booking Form Handoff Text";

  async processOutputStream({
    part,
    state,
  }: ProcessOutputStreamArgs): Promise<ChunkType | null | undefined> {
    const { emit } = applyBookingFormHandoffStreamFilter(part, state);
    return emit ? part : null;
  }
}

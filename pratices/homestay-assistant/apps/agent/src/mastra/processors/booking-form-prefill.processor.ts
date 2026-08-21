import type { ProcessInputStepArgs, Processor } from "@mastra/core/processors";

import {
  resolveContinuityStayHint,
  stashBookingFormStayHint,
} from "@/mastra/booking/book-form-prefill";

/**
 * Runs before every step so a later get_room_by_id call (which opens the
 * Booking Form) can fall back to an earlier dated find_room in this
 * conversation when the model doesn't pass its own checkInDate/guests args
 * (see WORKFLOW — BOOK "partial info" — the model states check-in/guests
 * directly on get_room_by_id when the guest's latest message named them).
 */
export class BookingFormPrefillProcessor implements Processor {
  id = "booking-form-prefill";

  name = "Booking Form Prefill";

  processInputStep({ messages, requestContext }: ProcessInputStepArgs) {
    const continuityHint = resolveContinuityStayHint(messages);

    stashBookingFormStayHint(requestContext, continuityHint);

    return messages;
  }
}

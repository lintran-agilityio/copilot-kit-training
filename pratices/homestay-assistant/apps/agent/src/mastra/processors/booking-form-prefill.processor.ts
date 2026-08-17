import type { ProcessInputStepArgs, Processor } from "@mastra/core/processors";
import { formatTodayYmd } from "@repo/utils";

import {
  resolveContinuityStayHint,
  resolveCurrentMessageStayHint,
  stashBookingFormStayHint,
  type BookingFormStayHint,
} from "@/mastra/booking/book-form-prefill";

/**
 * Runs before every step so a later get_room_by_id call (which opens the
 * Booking Form) can prefill/focus the check-in date and guest count the
 * guest already stated in their BOOK message ("Book Heritage Master Suite
 * room at 18th"). The date stated in the *current* message always wins;
 * an earlier unrelated dated search only fills in when the current message
 * has no date of its own.
 */
export class BookingFormPrefillProcessor implements Processor {
  id = "booking-form-prefill";

  name = "Booking Form Prefill";

  processInputStep({ messages, requestContext }: ProcessInputStepArgs) {
    const today = formatTodayYmd();
    const currentHint = resolveCurrentMessageStayHint(messages, today);
    const continuityHint = currentHint?.checkInDate
      ? null
      : resolveContinuityStayHint(messages);

    const merged: BookingFormStayHint = {
      ...continuityHint,
      ...currentHint,
    };

    stashBookingFormStayHint(requestContext, merged);

    return messages;
  }
}

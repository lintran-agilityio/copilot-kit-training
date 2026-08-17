// Libs
import { createTool } from "@mastra/core/tools";

import { BookingStatus } from "@repo/types";
import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { createBookingInputSchema } from "@repo/schemas";
import { bookingSchema } from "@/mastra/schemas/booking";
import { createBooking } from "@/mastra/services";
import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import { takePinnedStay } from "@/mastra/utils/resolve-pinned-stay";
import {
  commitIfNotAborted,
  serviceContextFromTool,
  throwIfAborted,
} from "@/mastra/utils/abort";
import { MUTATION_SUCCESS_HITL_REPLY_REQUIREMENT } from "@/mastra/utils/generic-ui-reply-hints";

export const createBookingTool = createTool({
  id: TOOL_KEYS.BOOKING.CREATE_BOOKING,
  description: `
    Create a new confirmed room booking after confirm_booking returns confirmed: true.
      - Use roomId, checkInDate, checkOutDate, and guests from the confirm_booking result.
      - ${MUTATION_SUCCESS_HITL_REPLY_REQUIREMENT}
      - The same confirm HITL card updates in place to success/failed — do not expect a separate success card.
      - The signed-in user is always taken from the server session — never pass a userId.
    `,
  inputSchema: createBookingInputSchema,
  outputSchema: bookingSchema,
  execute: async (params, context) => {
    throwIfAborted(context.abortSignal);
    const { requestContext, abortSignal } = context;

    const pinned = takePinnedStay(
      requestContext,
      REQUEST_CONTEXT_KEYS.PENDING_CREATE_STAY,
    );

    const roomId = pinned?.roomId ?? params.roomId;
    const checkInDate = pinned?.checkInDate ?? params.checkInDate;
    const checkOutDate = pinned?.checkOutDate ?? params.checkOutDate;
    const guests = pinned?.guests ?? params.guests;

    return commitIfNotAborted(abortSignal, () =>
      createBooking(
        {
          roomId,
          checkInDate,
          checkOutDate,
          guests,
          status: params.status ?? BookingStatus.CONFIRMED,
        },
        serviceContextFromTool(context),
      ),
    );
  },
});

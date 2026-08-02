// Libs
import { createTool } from "@mastra/core/tools";

import { BookingStatus } from "@repo/types";
import { TOOL_KEYS } from "@repo/constants/tool-keys";
import {
  createBookingSchema,
  bookingSchema,
} from "@/mastra/schemas/booking";
import { createBooking } from "@/mastra/services";
import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import { getAuthUserId } from "@/mastra/middleware/get-auth-user-id";
import {
  clearPinnedStay,
  readPinnedStay,
} from "@/mastra/utils/resolve-pinned-stay";

export const createBookingTool = createTool({
  id: TOOL_KEYS.BOOKING.CREATE_BOOKING,
  description:
    "Create a confirmed room booking after confirm_booking returns confirmed: true. Use roomId, checkInDate, checkOutDate, and guests from the confirm_booking result. ConfirmSuccess renders automatically from this tool result (like cancel_booking). After success, send one short guest-facing chat confirmation. The signed-in user is always taken from the server session — never pass a userId.",
  inputSchema: createBookingSchema,
  outputSchema: bookingSchema,
  execute: async (params, context) => {
    console.log("----CREATE BOOKING TOOL EXECUTED----");
    const userId = getAuthUserId(
      context,
      "Authentication required to create a booking",
    );

    const pinned = readPinnedStay(
      context.requestContext,
      REQUEST_CONTEXT_KEYS.PENDING_CREATE_STAY,
    );

    const roomId = pinned?.roomId ?? params.roomId;
    const checkInDate = pinned?.checkInDate ?? params.checkInDate;
    const checkOutDate = pinned?.checkOutDate ?? params.checkOutDate;
    const guests = pinned?.guests ?? params.guests;

    clearPinnedStay(
      context.requestContext,
      REQUEST_CONTEXT_KEYS.PENDING_CREATE_STAY,
    );

    const booking = await createBooking(
      {
        roomId,
        userId,
        checkInDate,
        checkOutDate,
        guests,
        status: params.status ?? BookingStatus.CONFIRMED,
      },
      { requestContext: context.requestContext },
    );
    return booking;
  },
});

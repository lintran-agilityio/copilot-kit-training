// Libs
import { createTool } from "@mastra/core/tools";

import { BookingStatus } from "@repo/types";
import { TOOL_KEYS } from "@repo/constants/tool-keys";
import {
  createBookingSchema,
  bookingSchema,
  type CreateBookingSchema,
} from "@/mastra/schemas/booking";
import { resolveAgentUserId } from "@/mastra/utils/resolve-agent-user-id";
import { createBooking } from "@/mastra/services";

const resolveCreateBookingUserId = (
  params: CreateBookingSchema,
  resourceId?: string,
) => {
  if (params.userId) {
    return params.userId;
  }

  return resolveAgentUserId(
    resourceId,
    "Authentication required to create a booking",
  );
};

export const createBookingTool = createTool({
  id: TOOL_KEYS.BOOKING.CREATE_BOOKING,
  description:
    "Create a confirmed room booking after confirm_booking returns confirmed: true. Use roomId, checkInDate, checkOutDate, and guests from the confirm_booking result. ConfirmSuccess renders automatically from this tool result (like cancel_booking). After success, send one short guest-facing chat confirmation. The signed-in user is resolved automatically from the server session.",
  inputSchema: createBookingSchema,
  outputSchema: bookingSchema,
  execute: async (params, context) => {
    const userId = resolveCreateBookingUserId(
      params,
      context.agent?.resourceId,
    );

    const booking = await createBooking({
      roomId: params.roomId,
      userId,
      checkInDate: params.checkInDate,
      checkOutDate: params.checkOutDate,
      guests: params.guests,
      status: params.status ?? BookingStatus.CONFIRMED,
    });
    return booking;
  },
});

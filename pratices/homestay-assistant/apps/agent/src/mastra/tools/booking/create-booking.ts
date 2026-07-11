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
  id: TOOL_KEYS.BOOKING.CREATE,
  description:
    "Create a confirmed room booking after the user approved the draft in the modal. Then call sync_booking_result with the booking. The signed-in user is resolved automatically from the server session.",
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

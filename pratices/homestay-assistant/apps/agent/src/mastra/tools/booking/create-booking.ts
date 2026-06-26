// Libs
import { createTool } from "@mastra/core/tools";

import { BookingStatus } from "@repo/types";
import { TOOL_KEYS } from "@repo/constants/tool-keys";
import {
  createBookingSchema,
  bookingSchema,
  CreateBookingSchema,
} from "../../schemas/booking";
import { createBooking } from "../../../services/booking.services";

export const createBookingTool = createTool({
  id: TOOL_KEYS.BOOKING.CREATE,
  description:
    "Create a confirmed room booking after the user has approved the draft. Requires roomId, userId, check-in, check-out, and guest count.",
  inputSchema: createBookingSchema,
  outputSchema: bookingSchema,
  execute: async ({
    roomId,
    userId,
    checkInDate,
    checkOutDate,
    guests,
    status,
  }: CreateBookingSchema) => {
    const booking = await createBooking({
      roomId,
      userId,
      checkInDate,
      checkOutDate,
      guests,
      status: status ?? BookingStatus.CONFIRMED,
    });
    return booking;
  },
});

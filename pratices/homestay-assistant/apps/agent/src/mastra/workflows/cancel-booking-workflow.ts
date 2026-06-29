import { createStep, createWorkflow } from "@mastra/core/workflows";
import { parseThreadResourceId } from "@repo/utils";
import { z } from "zod";

import { findBookingByRoomName } from "../../services";
import { cancellationBookingSchema } from "../schemas/booking";

const findBookingForCancellation = createStep({
  id: "find-booking-for-cancellation",
  description:
    "Find an active user booking that matches the given room name.",
  inputSchema: z.object({
    roomName: z
      .string()
      .describe("Room name mentioned by the user, e.g. The Observatory"),
  }),
  outputSchema: z.object({
    status: z.enum(["ready_to_confirm", "not_found", "ambiguous"]),
    message: z.string(),
    booking: cancellationBookingSchema.optional(),
    candidates: z.array(cancellationBookingSchema).optional(),
  }),
  execute: async ({ inputData, resourceId }) => {
    const { roomName } = inputData;

    if (!resourceId) {
      throw new Error("Authentication required to find bookings for cancellation");
    }

    const { userId } = parseThreadResourceId(resourceId);
    const result = await findBookingByRoomName(userId, roomName);

    if (result.status === "found") {
      return {
        status: "ready_to_confirm" as const,
        message: `Found booking for ${result.booking.roomName} (${result.booking.checkInDate} to ${result.booking.checkOutDate}).`,
        booking: result.booking,
      };
    }

    if (result.status === "ambiguous") {
      return {
        status: "ambiguous" as const,
        message: result.message,
        candidates: result.bookings,
      };
    }

    return {
      status: "not_found" as const,
      message: result.message,
    };
  },
});

export const cancelBookingWorkflow = createWorkflow({
  id: "cancel-booking-workflow",
  description:
    "Find a user's booked reservation by room name before cancellation. Use when the user wants to cancel a booking and provides a room name.",
  inputSchema: z.object({
    roomName: z
      .string()
      .describe("Room name to cancel, e.g. The Observatory"),
  }),
  outputSchema: z.object({
    status: z.enum(["ready_to_confirm", "not_found", "ambiguous"]),
    message: z.string(),
    booking: cancellationBookingSchema.optional(),
    candidates: z.array(cancellationBookingSchema).optional(),
  }),
})
  .then(findBookingForCancellation)
  .commit();

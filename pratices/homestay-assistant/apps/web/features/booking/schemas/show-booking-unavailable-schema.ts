import { z } from "zod";

export const bookingUnavailableReasonSchema = z.enum([
  "dates_unavailable",
  "capacity_exceeded",
]);

export type BookingUnavailableReason = z.infer<
  typeof bookingUnavailableReasonSchema
>;

export const showBookingUnavailableSchema = z.object({
  roomName: z.string().describe("Room name from checkRoomAvailability.result.room"),
  checkInDate: z.string().describe("Requested check-in date (YYYY-MM-DD)"),
  checkOutDate: z.string().describe("Requested check-out date (YYYY-MM-DD)"),
  guests: z.number().describe("Requested guest count"),
  reason: bookingUnavailableReasonSchema.describe(
    "dates_unavailable when the stay dates are taken; capacity_exceeded when guests exceed room.capacity",
  ),
  capacity: z
    .number()
    .optional()
    .describe("room.capacity — required when reason is capacity_exceeded"),
});

export type ShowBookingUnavailableArgs = z.infer<
  typeof showBookingUnavailableSchema
>;

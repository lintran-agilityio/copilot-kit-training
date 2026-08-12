import { z } from "zod";
import { BookingStatus } from "@repo/types";

export const getBookingsInputSchema = z.object({
  roomId: z.string().optional().describe("Filter by room ID"),
  status: z
    .enum(Object.values(BookingStatus) as [string, ...string[]])
    .optional()
    .describe("Filter by booking status"),
  onDate: z
    .string()
    .optional()
    .describe(
      "YYYY-MM-DD — return active bookings whose stay includes this date (checkIn <= onDate < checkOut). Use for show/list my bookings with a date cue (e.g. at 15 → this month's 15th) and for cancel/modify disambiguation with a date cue.",
    ),
});

export type GetBookingsInput = z.infer<typeof getBookingsInputSchema>;

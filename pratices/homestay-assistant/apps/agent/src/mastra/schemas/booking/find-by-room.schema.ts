import { z } from "zod";

import { cancellationBookingSchema } from "./cancel-schema";

export const findBookingByRoomInputSchema = z.object({
  roomName: z
    .string()
    .describe("Room name mentioned by the user, e.g. Bamboo Family Suite"),
});

export const findBookingByRoomOutputSchema = z.object({
  bookings: z
    .array(cancellationBookingSchema)
    .describe("Matching active bookings — use bookings.length to decide the next step"),
  queryName: z
    .string()
    .describe("Trimmed room name from the user's message"),
});

export type FindBookingByRoomInput = z.infer<
  typeof findBookingByRoomInputSchema
>;
export type FindBookingByRoomOutput = z.infer<
  typeof findBookingByRoomOutputSchema
>;

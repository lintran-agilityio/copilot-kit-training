import { z } from "zod";

import { cancellationBookingSchema } from "./cancel.schema";

export const findBookingByNameInputSchema = z.object({
  roomName: z
    .string()
    .describe("Room name mentioned by the user, e.g. Bamboo Family Suite"),
});

export const findBookingByNameOutputSchema = z.object({
  bookings: z
    .array(cancellationBookingSchema)
    .describe("Matching active bookings — use bookings.length to decide the next step"),
  queryName: z
    .string()
    .describe("Trimmed room name from the user's message"),
});

export type FindBookingByNameInput = z.infer<
  typeof findBookingByNameInputSchema
>;
export type FindBookingByNameOutput = z.infer<
  typeof findBookingByNameOutputSchema
>;

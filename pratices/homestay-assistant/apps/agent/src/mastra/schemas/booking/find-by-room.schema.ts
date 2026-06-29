import { z } from "zod";
import { cancellationBookingSchema } from "./cancel-schema";

export const findBookingByRoomInputSchema = z.object({
  roomName: z
    .string()
    .describe("Room name mentioned by the user, e.g. Bamboo Family Suite"),
});

export const findBookingByRoomOutputSchema = z.object({
  status: z.enum(["found", "not_found", "ambiguous"]),
  message: z.string(),
  booking: cancellationBookingSchema.optional(),
  candidates: z.array(cancellationBookingSchema).optional(),
});

export type FindBookingByRoomInput = z.infer<
  typeof findBookingByRoomInputSchema
>;
export type FindBookingByRoomOutput = z.infer<
  typeof findBookingByRoomOutputSchema
>;

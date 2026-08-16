import { z } from "zod";
import { roomSchema } from "@repo/schemas";

export const getRoomDetailOutputSchema = z.object({
  room: roomSchema.extend({
    /**
     * Booking Form prefill hint — set only when a prior dated search already
     * established these values in this conversation. The guest can still
     * edit them; this is a default, not a commitment.
     */
    checkInDate: z.string().optional(),
    checkOutDate: z.string().optional(),
  }),
});

export type GetRoomDetailOutput = z.infer<typeof getRoomDetailOutputSchema>;

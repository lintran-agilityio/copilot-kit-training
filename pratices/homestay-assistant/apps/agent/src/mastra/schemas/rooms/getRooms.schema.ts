import { z } from "zod";

import { roomSchema } from "./room.schema";

export const getRoomsInputSchema = z.object({});

export type GetRoomsInput = z.infer<typeof getRoomsInputSchema>;

export const getRoomsOutputSchema = z.object({
  rooms: z.array(roomSchema),
});

export type GetRoomsOutput = z.infer<typeof getRoomsOutputSchema>;
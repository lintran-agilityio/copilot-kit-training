import { z } from "zod";

import { roomSchema } from "./room.schema";

export const getAvailableRoomsInputSchema = z.object({
  date: z
    .string()
    .describe("The check-in date to get available rooms for (YYYY-MM-DD)"),
});

export type GetAvailableRoomsInput = z.infer<
  typeof getAvailableRoomsInputSchema
>;

export const getAvailableRoomsOutputSchema = z.object({
  rooms: z.array(roomSchema),
});

export type GetAvailableRoomsOutput = z.infer<
  typeof getAvailableRoomsOutputSchema
>;

export const availableRoomsResponseSchema = z.array(roomSchema);
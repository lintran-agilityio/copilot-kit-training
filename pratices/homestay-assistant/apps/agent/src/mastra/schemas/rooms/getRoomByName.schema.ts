import { z } from "zod";

import { roomSchema } from "./room.schema";

export const getRoomByNameInputSchema = z.object({
  roomName: z
    .string()
    .describe("Room display name mentioned by the user, e.g. The Observatory"),
});

export const getRoomByNameOutputSchema = z.object({
  rooms: z
    .array(roomSchema)
    .describe("Matching rooms — use rooms.length to decide the next step"),
  queryName: z
    .string()
    .describe("Trimmed room name from the user's message"),
});

export type GetRoomByNameInput = z.infer<typeof getRoomByNameInputSchema>;
export type GetRoomByNameOutput = z.infer<typeof getRoomByNameOutputSchema>;

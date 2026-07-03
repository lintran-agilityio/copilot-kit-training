import { z } from "zod";
import { roomSchema } from "./room.schema";

export const getRoomDetailInputSchema = z.object({
  roomId: z.string(),
});

export type GetRoomDetailInput = z.infer<typeof getRoomDetailInputSchema>;

export const getRoomDetailOutputSchema = z.object({
  room: roomSchema,
});

export type GetRoomDetailOutput = z.infer<typeof getRoomDetailOutputSchema>;
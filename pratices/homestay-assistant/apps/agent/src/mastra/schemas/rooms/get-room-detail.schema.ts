import { z } from "zod";
import { roomSchema } from "@repo/schemas";

export const getRoomDetailOutputSchema = z.object({
  room: roomSchema,
});

export type GetRoomDetailOutput = z.infer<typeof getRoomDetailOutputSchema>;

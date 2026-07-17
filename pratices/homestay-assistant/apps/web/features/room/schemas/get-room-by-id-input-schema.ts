import { z } from "zod";

export const getRoomByIdInputSchema = z.object({
  roomId: z.string().describe("Room ID to fetch"),
});

export type GetRoomByIdInputArgs = z.infer<typeof getRoomByIdInputSchema>;

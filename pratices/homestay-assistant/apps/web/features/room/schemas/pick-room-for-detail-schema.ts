import { z } from "zod";

import { roomObjectSchema } from "@/features/room/schemas/room-schemas";

export const pickRoomForDetailSchema = z.object({
  rooms: z
    .array(roomObjectSchema)
    .describe("Matching rooms from getRoomByName — pass rooms as-is"),
  queryName: z.string().describe("Room name query from getRoomByName"),
});

export type PickRoomForDetailArgs = z.infer<typeof pickRoomForDetailSchema>;

export type PickRoomForDetailResult =
  | {
      confirmed: false;
      reason: "declined";
    }
  | {
      confirmed: true;
      room: z.infer<typeof roomObjectSchema>;
    };

import { z } from "zod";

import { amenitySchema } from "./room-schemas";

const pickRoomDetailRoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number(),
  levelColor: z.string(),
  capacity: z.number(),
  description: z.string(),
  imageUrl: z.string(),
  availableSlots: z.number(),
  pricePerNight: z.number(),
  amenities: z.array(amenitySchema),
});

export const pickRoomForDetailSchema = z.object({
  rooms: z
    .array(pickRoomDetailRoomSchema)
    .describe("Matching rooms from getRoomByName — pass rooms as-is"),
  queryName: z
    .string()
    .describe("Room name query from getRoomByName"),
});

export type PickRoomForDetailArgs = z.infer<typeof pickRoomForDetailSchema>;

export type PickRoomForDetailResult =
  | {
      confirmed: false;
      reason: "declined";
    }
  | {
      confirmed: true;
      room: z.infer<typeof pickRoomDetailRoomSchema>;
    };

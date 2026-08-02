import { z } from "zod";

export const amenitySchema = z.enum([
  "monitor",
  "coffee",
  "mic",
  "wifi",
  "video",
  "whiteboard",
  "phone",
]);

export const roomCardSchema = z.object({
  id: z.string().describe("Unique room identifier"),
  name: z.string().describe("Room display name"),
  level: z.number().describe("Floor level number"),
  levelColor: z
    .string()
    .describe("Hex color for the level accent bar, e.g. #E6C547"),
  capacity: z.number().describe("Maximum number of people"),
  description: z.string().describe("Short room description"),
  imageUrl: z.string().describe("URL of the room image"),
  availableSlots: z.number().describe("Number of available booking slots"),
  amenities: z
    .array(amenitySchema)
    .describe("List of room amenities"),
  compact: z
    .boolean()
    .optional()
    .describe("Use compact layout when rendering inside chat"),
});

export const roomObjectSchema = roomCardSchema
  .omit({ compact: true })
  .extend({
    pricePerNight: z.number().describe("Price per night in VND"),
  });

export const updateRoomListSchema = z.object({
  roomIds: z
    .array(z.string())
    .describe(
      "Room IDs only — get_rooms result.roomIds, or find_room result.rooms[].id. Never send full room objects; the UI resolves the details itself.",
    ),
  title: z
    .string()
    .optional()
    .describe("Optional heading above the room grid"),
});

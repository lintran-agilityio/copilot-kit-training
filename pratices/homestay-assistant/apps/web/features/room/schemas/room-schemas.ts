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
  rooms: z
    .array(roomObjectSchema)
    .describe(
      "Full room objects returned from getRooms or getAvailableRooms — pass the rooms array as-is",
    ),
  title: z
    .string()
    .optional()
    .describe("Optional heading above the room grid"),
});

export const setRoomListLoadingSchema = z.object({
  isLoading: z
    .boolean()
    .describe("Set true while room list data is loading, false when loading ends"),
});


export const showRoomDetailSchema = z
  .object({
    room: roomObjectSchema
      .optional()
      .describe(
        "Full room object from getRoomById — pass as-is when already fetched",
      ),
    roomId: z
      .string()
      .optional()
      .describe(
        "Room id from the user message (roomId: …) — use when the full room object is not available yet",
      ),
  })
  .refine((value) => Boolean(value.room ?? value.roomId), {
    message: "Either room or roomId is required",
  });
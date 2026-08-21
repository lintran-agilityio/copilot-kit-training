import { z } from "zod";

export const getRoomByIdInputSchema = z.object({
  roomId: z.string().describe("Room ID to fetch"),
  checkInDate: z
    .string()
    .optional()
    .describe("YYYY-MM-DD check-in date already stated in the guest's latest message, to prefill the Booking Form"),
  checkOutDate: z
    .string()
    .optional()
    .describe("YYYY-MM-DD check-out date already stated in the guest's latest message, to prefill the Booking Form"),
  guests: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Guest count already stated in the guest's latest message, to prefill the Booking Form"),
});

export type GetRoomByIdInput = z.infer<typeof getRoomByIdInputSchema>;

import { z } from "zod";

export const createBookingInputSchema = z.object({
  roomId: z.string().describe("Room ID to book"),
  checkInDate: z.string().describe("Check-in date (YYYY-MM-DD)"),
  checkOutDate: z.string().describe("Check-out date (YYYY-MM-DD)"),
  guests: z.number().describe("Number of guests"),
});

export type CreateBookingInputArgs = z.infer<typeof createBookingInputSchema>;

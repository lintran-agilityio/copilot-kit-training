import { z } from "zod";
import { BookingStatus } from "@repo/types";

export const createBookingSchema = z.object({
  roomId: z.string().describe("Room ID to book"),
  checkInDate: z.string().describe("Check-in date (YYYY-MM-DD)"),
  checkOutDate: z.string().describe("Check-out date (YYYY-MM-DD)"),
  guests: z.number().describe("Number of guests"),
  status: z
    .enum(Object.values(BookingStatus) as [string, ...string[]])
    .optional()
    .describe("Booking status; defaults to CONFIRMED after user approval"),
});

export type CreateBookingSchema = z.infer<typeof createBookingSchema>;

export type CreateBookingPayload = CreateBookingSchema & { userId: string };

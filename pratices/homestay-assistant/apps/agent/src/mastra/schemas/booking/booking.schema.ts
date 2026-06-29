import { z } from "zod";
import { BookingStatus } from "@repo/types";

/** Room shape embedded in booking list responses (often partial). */
export const bookingRoomSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number().optional(),
  levelColor: z.string().optional(),
  capacity: z.number().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  availableSlots: z.number().optional(),
  pricePerNight: z.number().optional(),
  amenities: z.array(z.string()).optional(),
});

export const bookingSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  userId: z.string(),
  checkInDate: z.string(),
  checkOutDate: z.string(),
  guests: z.number(),
  totalPrice: z.number(),
  status: z.enum(Object.values(BookingStatus) as [string, ...string[]]),
  room: bookingRoomSummarySchema.optional(),
});

export type Booking = z.infer<typeof bookingSchema>;

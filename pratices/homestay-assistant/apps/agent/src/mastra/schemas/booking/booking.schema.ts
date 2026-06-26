import { z } from "zod";
import { BookingStatus } from "@repo/types";

export const bookingSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  userId: z.string(),
  checkInDate: z.string(),
  checkOutDate: z.string(),
  guests: z.number(),
  totalPrice: z.number(),
  status: z.enum(Object.values(BookingStatus) as [string, ...string[]]),
});

export type Booking = z.infer<typeof bookingSchema>;

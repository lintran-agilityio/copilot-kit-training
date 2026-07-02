import { z } from "zod";

const bookingListItemSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  userId: z.string(),
  checkInDate: z.string(),
  checkOutDate: z.string(),
  guests: z.number(),
  totalPrice: z.number(),
  status: z.string(),
  room: z
    .object({
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
    })
    .optional(),
});

export const updateBookingsListSchema = z.object({
  bookings: z
    .array(bookingListItemSchema)
    .describe("Bookings from getBookings — pass as-is"),
});

export const showCancellationSuccessSchema = z.object({
  roomName: z
    .string()
    .optional()
    .describe("Cancelled room name for the success notice"),
});

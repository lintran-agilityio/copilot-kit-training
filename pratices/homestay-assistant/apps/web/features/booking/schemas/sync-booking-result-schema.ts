import { z } from "zod";

const syncBookingItemSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  userId: z.string().optional(),
  checkInDate: z.string(),
  checkOutDate: z.string(),
  guests: z.number(),
  totalPrice: z.number(),
  status: z.string().optional(),
});

export const syncBookingResultSchema = z.object({
  status: z
    .enum(["success", "error"])
    .describe('Use "success" when createBooking succeeds; "error" on failure'),
  booking: syncBookingItemSchema
    .optional()
    .describe("Booking from createBooking — pass as-is when status is success"),
  errorMessage: z
    .string()
    .optional()
    .describe("Error message when status is error"),
});

export type SyncBookingResultArgs = z.infer<typeof syncBookingResultSchema>;

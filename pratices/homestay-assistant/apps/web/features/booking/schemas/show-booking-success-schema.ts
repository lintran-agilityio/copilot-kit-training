import { z } from "zod";

export const showBookingSuccessSchema = z.object({
  checkInDate: z.string().describe("Check-in date (YYYY-MM-DD) from createBooking"),
  checkOutDate: z.string().describe("Check-out date (YYYY-MM-DD) from createBooking"),
  guests: z.number().describe("Number of guests from createBooking"),
  totalPrice: z.number().describe("Total price from createBooking"),
});

export type ShowBookingSuccessArgs = z.infer<typeof showBookingSuccessSchema>;

/** Returned when the guest closes the success dialog. */
export type ShowBookingSuccessResult = {
  acknowledged: true;
};

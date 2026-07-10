import { z } from "zod";

import { roomCardSchema } from "@/features/room/schemas/room-schemas";

const bookingRoomSchema = roomCardSchema
  .omit({ compact: true })
  .extend({
    pricePerNight: z.number().describe("Price per night in VND"),
  });

export const selectRoomForBookingSchema = z.object({
  id: z.string().describe("Room identifier"),
  name: z.string().describe("Room display name"),
  pricePerNight: z.number().describe("Nightly rate in VND"),
  capacity: z.number().describe("Maximum guest capacity"),
});

export const openConfirmBookingSchema = z.object({
  room: bookingRoomSchema.describe(
    "Full room object from checkRoomAvailability.result.room — opens the confirm booking drawer",
  ),
  checkInDate: z.string().describe("Check-in date (YYYY-MM-DD)"),
  checkOutDate: z.string().describe("Check-out date (YYYY-MM-DD)"),
  guests: z.number().describe("Number of guests"),
});

/** @deprecated Use openConfirmBookingSchema */
export const updateBookingFormSchema = openConfirmBookingSchema;

import { z } from "zod";

import { confirmBookingSchema } from "@/features/booking/schemas";

export const selectRoomForBookingSchema = z.object({  id: z.string().describe("Room identifier"),
  name: z.string().describe("Room display name"),
  pricePerNight: z.number().describe("Nightly rate in VND"),
  capacity: z.number().describe("Maximum guest capacity"),
});

export const openConfirmBookingSchema = confirmBookingSchema;

/** @deprecated Use confirmBookingSchema from @/features/booking/schemas */
export const updateBookingFormSchema = confirmBookingSchema;
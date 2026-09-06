import { z } from "zod";
import { findRoomInputSchema as findRoomInputBaseSchema, roomSchema } from "@repo/schemas";

/**
 * Availability probe attached to a `book_resolve` result with exactly one
 * match — and only when the guest has already committed to both a check-in
 * date and a guest count (stated this turn or from an earlier dated/guest-count
 * search). `findRoomTool.execute` calls the `/bookings/availability` endpoint
 * for the resolved room so the CREATE flow no longer needs a separate
 * `check_room_availability` tool call. Absent → the Booking Form opens and runs
 * its own check.
 */
export const findRoomAvailabilitySchema = z.object({
  available: z.boolean(),
  guestsWithinCapacity: z.boolean(),
  checkInDate: z.string(),
  checkOutDate: z.string(),
  guests: z.number(),
});

export type FindRoomAvailability = z.infer<typeof findRoomAvailabilitySchema>;

export const findRoomOutputSchema = z.object({
  rooms: z.array(roomSchema),
  name: z.string().optional(),
  date: z.string().optional(),
  guests: z.number().optional(),
  level: z.number().optional(),
  /** Echoed from input — FE uses this to skip Room List on book_resolve + 1 match. */
  purpose: findRoomInputBaseSchema.shape.purpose,
  /** book_resolve + exactly one match only — see findRoomAvailabilitySchema. */
  availability: findRoomAvailabilitySchema.optional(),
});

export type FindRoomOutput = z.infer<typeof findRoomOutputSchema>;

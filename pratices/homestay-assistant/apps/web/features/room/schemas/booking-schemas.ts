import { z } from "zod";

export const selectRoomForBookingSchema = z.object({
  id: z.string().describe("Room identifier"),
  name: z.string().describe("Room display name"),
  pricePerNight: z.number().describe("Nightly rate in USD"),
  capacity: z.number().describe("Maximum guest capacity"),
});

export const confirmBookingSchema = z.object({
  roomName: z.string().describe("Name of the room to book"),
  checkInDate: z.string().describe("Check-in date (YYYY-MM-DD)"),
  checkOutDate: z.string().describe("Check-out date (YYYY-MM-DD)"),
  guests: z.number().describe("Number of guests"),
  totalPrice: z.number().describe("Total booking price in USD"),
});

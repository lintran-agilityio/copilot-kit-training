"use client";

import { useBookingsStore } from "@/features/booking/stores/bookings-store";

export const useBookingsList = () =>
  useBookingsStore((state) => state.bookings);

export const useSetBookings = () =>
  useBookingsStore((state) => state.setBookings);

export const useUpsertBooking = () =>
  useBookingsStore((state) => state.upsertBooking);

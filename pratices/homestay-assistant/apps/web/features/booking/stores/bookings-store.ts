import { create } from "zustand";

import type { BookingResponse } from "@/features/booking/types/booking";

type BookingsStore = {
  bookings: BookingResponse[];
  setBookings: (bookings: BookingResponse[]) => void;
  removeBooking: (bookingId: string) => void;
  upsertBooking: (booking: BookingResponse) => void;
};

export const useBookingsStore = create<BookingsStore>()((set) => ({
  bookings: [],

  setBookings: (bookings) => set({ bookings }),

  removeBooking: (bookingId) =>
    set((state) => ({
      bookings: state.bookings.filter((booking) => booking.id !== bookingId),
    })),

  upsertBooking: (booking) =>
    set((state) => {
      const index = state.bookings.findIndex((item) => item.id === booking.id);

      if (index === -1) {
        return { bookings: [booking, ...state.bookings] };
      }

      const next = [...state.bookings];
      next[index] = booking;
      return { bookings: next };
    }),
}));

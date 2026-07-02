import { create } from "zustand";

import type { BookingResponse } from "@/features/booking/types/booking";

type BookingsStore = {
  bookings: BookingResponse[];
  cancellationNotice: { roomName: string } | null;
  setBookings: (bookings: BookingResponse[]) => void;
  setCancellationNotice: (notice: { roomName: string } | null) => void;
  upsertBooking: (booking: BookingResponse) => void;
};

export const useBookingsStore = create<BookingsStore>()((set) => ({
  bookings: [],
  cancellationNotice: null,

  setBookings: (bookings) => set({ bookings }),

  setCancellationNotice: (cancellationNotice) => set({ cancellationNotice }),

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

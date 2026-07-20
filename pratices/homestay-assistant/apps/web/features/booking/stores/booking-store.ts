import { create } from "zustand";

import type { BookingDraft } from "@/features/booking/types/booking";

export interface BookingStore extends BookingDraft {
  setRoomId: (roomId: string | null) => void;
  updateBookingDraft: (input: Partial<BookingDraft>) => void;
  resetBooking: () => void;
}

const DEFAULT_DRAFT: BookingDraft = {
  roomId: null,
  checkInDate: null,
  checkOutDate: null,
  guests: 1,
};

export const useBookingStore = create<BookingStore>()((set) => ({
  ...DEFAULT_DRAFT,

  setRoomId: (roomId) =>
    set((state) => (state.roomId === roomId ? state : { roomId })),

  updateBookingDraft: (input) =>
    set((state) => {
      const next = { ...state, ...input };
      if (
        next.roomId === state.roomId &&
        next.checkInDate === state.checkInDate &&
        next.checkOutDate === state.checkOutDate &&
        next.guests === state.guests
      ) {
        return state;
      }
      return input;
    }),

  resetBooking: () => set({ ...DEFAULT_DRAFT }),
}));

import { create } from "zustand";

import type { BookingDraft } from "@/features/booking/types/booking";
import { useHomestayAgentUiStore } from "@/features/chat/stores/homestay-agent-ui-store";

export interface BookingStore extends BookingDraft {
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

  resetBooking: () => {
    useHomestayAgentUiStore.getState().resetWorkflow();
    set({ ...DEFAULT_DRAFT });
  },
}));

import { create } from "zustand";

import type {
  BookingDraft,
  PendingModifyStay,
} from "@/features/booking/types/booking";
import { useHomestayAgentUiStore } from "@/features/chat/stores/homestay-agent-ui-store";

export interface BookingStore extends BookingDraft {
  pendingModifyStay: PendingModifyStay | null;
  updateBookingDraft: (input: Partial<BookingDraft>) => void;
  setPendingModifyStay: (stay: PendingModifyStay | null) => void;
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
  pendingModifyStay: null,

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
      return next;
    }),

  setPendingModifyStay: (stay) => set({ pendingModifyStay: stay }),

  resetBooking: () => {
    useHomestayAgentUiStore.getState().resetWorkflow();
    set((state) => ({ ...state, ...DEFAULT_DRAFT, pendingModifyStay: null }));
  },
}));

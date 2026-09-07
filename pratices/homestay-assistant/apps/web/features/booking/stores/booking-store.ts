import { create } from "zustand";

import type {
  BookingDraft,
  PendingModifyStay,
} from "@/features/booking/types/booking";
import type { Room } from "@/features/room/types/room";
import { useHomestayAgentUiStore } from "@/features/chatbot/stores/homestay-agent-ui-store";

export interface BookingStore extends BookingDraft {
  pendingModifyStay: PendingModifyStay | null;
  /**
   * Full room the guest is booking, stashed by the Booking Form when it emits
   * `[book-stay]`. `confirm_booking` args carry only `roomId`, so the confirm
   * card reads room name/price/capacity from here (see useConfirmBookingRoom).
   */
  bookingRoom: Room | null;
  updateBookingDraft: (input: Partial<BookingDraft>) => void;
  setPendingModifyStay: (stay: PendingModifyStay | null) => void;
  setBookingRoom: (room: Room | null) => void;
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
  bookingRoom: null,

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

  setBookingRoom: (room) => set({ bookingRoom: room }),

  resetBooking: () => {
    useHomestayAgentUiStore.getState().resetUiFocus();
    set((state) => ({
      ...state,
      ...DEFAULT_DRAFT,
      pendingModifyStay: null,
      bookingRoom: null,
    }));
  },
}));

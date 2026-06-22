// Libs
import { createStore } from "zustand";

import { BookingDraft, SelectedRoom } from "@/features/booking/types/booking";

export interface BookingStore extends BookingDraft {
  setSelectedRoom: (room: SelectedRoom) => void;
  setCheckInDate: (date: string) => void;
  setCheckOutDate: (date: string) => void;
  setGuests: (guests: number) => void;
  calculateTotalPrice: () => void;
  resetBooking: () => void;
}

export const createBookingStore = (initialState?: Partial<BookingDraft>) => {
  return createStore<BookingStore>()((set, get) => ({
    selectedRoom: null,
    checkInDate: null,
    checkOutDate: null,
    guests: 1,
    totalPrice: 0,
    ...initialState,

    setSelectedRoom: (room: SelectedRoom) => set({ selectedRoom: room }),
    setCheckInDate: (date: string) => set({ checkInDate: date }),
    setCheckOutDate: (date: string) => set({ checkOutDate: date }),
    setGuests: (guests: number) => set({ guests }),
    calculateTotalPrice: () => {
      const state = get();
      const { selectedRoom, checkInDate, checkOutDate } = state;

      if (!selectedRoom || !checkInDate || !checkOutDate) return;

      const start = new Date(checkInDate);
      const end = new Date(checkOutDate);
      const timeDiff =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) ||
        1;

      set({ totalPrice: timeDiff * selectedRoom.pricePerNight });
    },
    resetBooking: () =>
      set({
        selectedRoom: null,
        checkInDate: null,
        checkOutDate: null,
        guests: 1,
        totalPrice: 0,
      }),
  }));
};

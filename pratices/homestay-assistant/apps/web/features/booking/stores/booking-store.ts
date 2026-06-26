// Libs
import { createStore } from "zustand";

import type {
  BookingDraft,
  BookingSubmitStatus,
  CreatedBooking,
  SelectedRoom,
  UpdateBookingFormInput,
} from "@/features/booking/types/booking";

export interface BookingStore extends BookingDraft {
  isFormReady: boolean;
  formRevision: number;
  submitStatus: BookingSubmitStatus;
  submitError: string | null;
  createdBooking: CreatedBooking | null;
  setSelectedRoom: (room: SelectedRoom) => void;
  setCheckInDate: (date: string) => void;
  setCheckOutDate: (date: string) => void;
  setGuests: (guests: number) => void;
  calculateTotalPrice: () => void;
  updateBookingForm: (input: UpdateBookingFormInput) => void;
  setFormReady: (ready: boolean) => void;
  setSubmitStatus: (status: BookingSubmitStatus, error?: string | null) => void;
  setCreatedBooking: (booking: CreatedBooking) => void;
  resetBooking: () => void;
}

export const createBookingStore = (initialState?: Partial<BookingDraft>) => {
  return createStore<BookingStore>()((set, get) => ({
    selectedRoom: null,
    checkInDate: null,
    checkOutDate: null,
    guests: 1,
    totalPrice: 0,
    isFormReady: false,
    formRevision: 0,
    submitStatus: "idle",
    submitError: null,
    createdBooking: null,
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
    updateBookingForm: ({ room, checkInDate, checkOutDate, guests }) => {
      set((state) => ({
        selectedRoom: {
          id: room.id,
          name: room.name,
          pricePerNight: room.pricePerNight,
          capacity: room.capacity,
        },
        checkInDate,
        checkOutDate,
        guests,
        isFormReady: true,
        submitStatus: "idle",
        submitError: null,
        formRevision: state.formRevision + 1,
      }));
      get().calculateTotalPrice();
    },
    setFormReady: (ready) => set({ isFormReady: ready }),
    setSubmitStatus: (status, error = null) =>
      set({ submitStatus: status, submitError: error }),
    setCreatedBooking: (booking) => set({ createdBooking: booking }),
    resetBooking: () =>
      set({
        selectedRoom: null,
        checkInDate: null,
        checkOutDate: null,
        guests: 1,
        totalPrice: 0,
        isFormReady: false,
        submitStatus: "idle",
        submitError: null,
      }),
  }));
};

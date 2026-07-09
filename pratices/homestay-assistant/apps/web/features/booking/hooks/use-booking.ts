"use client";

import { useContext } from "react";
import { BookingStore } from "@/features/booking/stores/booking-store";
import { BookingContext } from "@/features/booking/stores/booking-provider";
import { useStore } from "zustand";

export const useBooking = <T>(selector: (state: BookingStore) => T): T => {
  const store = useContext(BookingContext);
  if (!store) {
    throw new Error("Booking context not found");
  }
  return useStore(store, selector);
};
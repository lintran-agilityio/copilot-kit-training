"use client";

// Libs
import { createContext, useEffect, useRef } from "react";

import { createBookingStore } from "./booking-store";

type BookingStoreApi = ReturnType<typeof createBookingStore>;

export const BookingContext = createContext<BookingStoreApi | null>(null);

let bookingStoreApiRef: BookingStoreApi | undefined;

export const getBookingStoreState = () => {
  if (!bookingStoreApiRef) {
    throw new Error("Booking store is not initialized");
  }

  return bookingStoreApiRef.getState();
};

type BookingProviderProps = {
  children: React.ReactNode;
};

export const BookingProvider = ({ children }: BookingProviderProps) => {
  const storeRef = useRef<BookingStoreApi | null>(null);

  if (!storeRef.current) {
    storeRef.current = createBookingStore();
  }

  useEffect(() => {
    bookingStoreApiRef = storeRef.current ?? undefined;

    return () => {
      bookingStoreApiRef = undefined;
    };
  }, []);

  return (
    <BookingContext.Provider value={storeRef.current}>
      {children}
    </BookingContext.Provider>
  );
};

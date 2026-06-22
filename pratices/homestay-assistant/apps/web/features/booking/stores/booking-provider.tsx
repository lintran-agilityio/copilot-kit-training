"use client";

// Libs
import { createContext, useRef } from "react";

import { createBookingStore } from "./booking-store";

type BookingStoreApi = ReturnType<typeof createBookingStore>;

export const BookingContext = createContext<BookingStoreApi | null>(null);

type BookingProviderProps = {
  children: React.ReactNode;
};

export const BookingProvider =({ children }: BookingProviderProps) => {
  const storeRef = useRef<BookingStoreApi | null>(null);

  if (!storeRef.current) {
    storeRef.current = createBookingStore();
  }

  return (
    <BookingContext.Provider value={storeRef.current}>
      {children}
    </BookingContext.Provider>
  );
};

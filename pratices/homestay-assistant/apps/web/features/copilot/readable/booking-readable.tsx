"use client";

import { useAgentContext } from "@copilotkit/react-core/v2";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { useBooking } from "@/features/booking/hooks/use-booking";
import { BookingStore } from "@/features/booking/stores/booking-store";

const selectBookingSnapshot = (state: BookingStore) => ({
  selectedRoom: state.selectedRoom,
  checkInDate: state.checkInDate,
  checkOutDate: state.checkOutDate,
  guests: state.guests,
  totalPrice: state.totalPrice,
});

export const BookingReadable = () => {
  const booking = useBooking(useShallow(selectBookingSnapshot));
  const contextValue = useMemo(
    () => JSON.parse(JSON.stringify(booking)),
    [booking],
  );

  useAgentContext({
    description: "Current draft booking",
    value: contextValue,
  });

  return null;
};

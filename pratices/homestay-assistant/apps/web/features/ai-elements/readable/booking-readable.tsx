"use client";

import { useAgentContext } from "@copilotkit/react-core/v2";
import { useMemo } from "react";

import { useBooking } from "@/features/booking/hooks/use-booking";

export const BookingReadable = () => {
  const selectedRoom = useBooking((state) => state.selectedRoom);
  const checkInDate = useBooking((state) => state.checkInDate);
  const checkOutDate = useBooking((state) => state.checkOutDate);
  const guests = useBooking((state) => state.guests);
  const totalPrice = useBooking((state) => state.totalPrice);
  const isFormReady = useBooking((state) => state.isFormReady);
  const submitStatus = useBooking((state) => state.submitStatus);
  const createdBooking = useBooking((state) => state.createdBooking);

  const contextValue = useMemo(
    () =>
      JSON.parse(
        JSON.stringify({
          selectedRoom,
          checkInDate,
          checkOutDate,
          guests,
          totalPrice,
          isFormReady,
          submitStatus,
          createdBooking,
        }),
      ),
    [
      selectedRoom,
      checkInDate,
      checkOutDate,
      guests,
      totalPrice,
      isFormReady,
      submitStatus,
      createdBooking,
    ],
  );

  useAgentContext({
    description: "Current draft booking and submission state",
    value: contextValue,
  });

  return null;
};

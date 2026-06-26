"use client";

import { useCallback } from "react";

import { createBookingAction } from "@/features/booking/actions/create-booking-action";
import { useBooking } from "@/features/booking/hooks/use-booking";

export const useCreateBooking = () => {
  const setSubmitStatus = useBooking((state) => state.setSubmitStatus);
  const setCreatedBooking = useBooking((state) => state.setCreatedBooking);
  const resetBooking = useBooking((state) => state.resetBooking);

  return useCallback(
    async (input: {
      roomId: string;
      checkInDate: string;
      checkOutDate: string;
      guests: number;
    }) => {
      setSubmitStatus("submitting");

      try {
        const booking = await createBookingAction(input);
        setCreatedBooking(booking);
        setSubmitStatus("success");
        return booking;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to create booking";
        setSubmitStatus("error", message);
        throw error;
      }
    },
    [setCreatedBooking, setSubmitStatus],
  );
};

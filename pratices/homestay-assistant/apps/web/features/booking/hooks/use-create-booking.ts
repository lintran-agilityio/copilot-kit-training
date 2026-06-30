"use client";

import { useCallback } from "react";

import { createBookingAction } from "@/features/booking/actions/create-booking-action";
import { useBooking } from "@/features/booking/hooks/use-booking";
import { useBookingsStore } from "@/features/booking/stores/bookings-store";
import type { BookingResponse } from "@/features/booking/types/booking";
import type { Room } from "@/features/room/types/room";

export const useCreateBooking = () => {
  const setSubmitStatus = useBooking((state) => state.setSubmitStatus);
  const setCreatedBooking = useBooking((state) => state.setCreatedBooking);

  return useCallback(
    async (
      input: {
        roomId: string;
        checkInDate: string;
        checkOutDate: string;
        guests: number;
      },
      room?: Room,
    ) => {
      setSubmitStatus("submitting");

      try {
        const booking = await createBookingAction(input);
        const bookingWithRoom: BookingResponse = room
          ? { ...booking, room }
          : booking;

        useBookingsStore.getState().upsertBooking(bookingWithRoom);
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

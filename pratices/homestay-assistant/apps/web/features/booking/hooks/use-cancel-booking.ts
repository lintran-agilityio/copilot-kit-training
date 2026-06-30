"use client";

import { useCallback } from "react";

import { cancelBookingAction } from "@/features/booking/actions/cancel-booking-action";
import { useBookingsStore } from "@/features/booking/stores/bookings-store";

export const useCancelBooking = () =>
  useCallback(async (bookingId: string) => {
    const booking = await cancelBookingAction(bookingId);
    useBookingsStore.getState().removeBooking(bookingId);
    return booking;
  }, []);

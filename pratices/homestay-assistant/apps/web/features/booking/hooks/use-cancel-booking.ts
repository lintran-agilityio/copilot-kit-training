"use client";

import { useCallback } from "react";

import { cancelBookingAction } from "@/features/booking/actions/cancel-booking-action";
import { refreshBookedRooms } from "@/features/booking/utils";

export const useCancelBooking = () =>
  useCallback(async (bookingId: string) => {
    const booking = await cancelBookingAction(bookingId);
    await refreshBookedRooms();
    return booking;
  }, []);

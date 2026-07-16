"use client";

import { useState } from "react";
import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { ConfirmDeleteDialog } from "@/components/confirm-modal";
import {
  isHitlToolAwaitingUser,
  isHitlToolFinished,
} from "@/features/ai-elements/utils/hitl-tool-status";
import type { ConfirmCancelBookingResult } from "@/features/booking/schemas";
import type { BookingDetails } from "@/features/booking/types";

type ConfirmCancelBookingModalProps = {
  status: ToolCallStatus;
  bookingItem: BookingDetails;
  respond?: (result: ConfirmCancelBookingResult) => Promise<void>;
};

const hasRequiredBooking = (booking: BookingDetails) =>
  Boolean(
    booking.bookingId?.trim() &&
      booking.roomName?.trim() &&
      booking.checkInDate?.trim() &&
      booking.checkOutDate?.trim(),
  );

export const ConfirmCancelBookingModal = ({
  status,
  bookingItem,
  respond,
}: ConfirmCancelBookingModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (isHitlToolFinished(status) || !isHitlToolAwaitingUser(status)) {
    return null;
  }

  if (!hasRequiredBooking(bookingItem)) {
    return null;
  }

  const canRespond = respond != null;

  const handleCancel = () => {
    if (!canRespond) {
      return;
    }

    void respond({ confirmed: false });
  };

  const handleConfirm = async () => {
    if (!canRespond || !bookingItem.bookingId) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await respond({
        confirmed: true,
        bookingId: bookingItem.bookingId,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to cancel booking",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConfirmDeleteDialog
      open
      booking={{
        bookingId: bookingItem.bookingId,
        roomName: bookingItem.roomName,
        checkInDate: bookingItem.checkInDate,
        checkOutDate: bookingItem.checkOutDate,
        guests: bookingItem.guests,
        totalPrice: bookingItem.totalPrice,
      }}
      isDeleting={isSubmitting}
      canRespond={canRespond}
      errorMessage={errorMessage}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
    />
  );
};

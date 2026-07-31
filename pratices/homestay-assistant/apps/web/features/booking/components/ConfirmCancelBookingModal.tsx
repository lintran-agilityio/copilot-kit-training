"use client";

import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { ConfirmDeleteDialog } from "@/components/confirm-modal";
import { useHitlConfirmDialog } from "@/features/booking/hooks";
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
  const {
    isVisible,
    isSubmitting,
    errorMessage,
    canRespond,
    handleDismiss,
    confirm,
  } = useHitlConfirmDialog(
    status,
    respond,
    "Failed to cancel booking",
  );

  if (!isVisible || !hasRequiredBooking(bookingItem)) {
    return null;
  }

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
      onCancel={handleDismiss}
      onConfirm={() => {
        if (!bookingItem.bookingId) {
          return;
        }

        void confirm({
          confirmed: true,
          bookingId: bookingItem.bookingId,
        });
      }}
    />
  );
};

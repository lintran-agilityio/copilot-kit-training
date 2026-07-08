"use client";

import { useState } from "react";
import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { ConfirmDeleteDialog } from "@/components/confirm-modal";
import type { ConfirmDeleteBookingResult } from "../../booking/schemas";
import type { BookingDetails } from "../../booking/types";

type ConfirmDeleteBookingModalProps = {
  status: ToolCallStatus;
  bookingItem: BookingDetails;
  respond?: (result: ConfirmDeleteBookingResult) => Promise<void>;
};

export const ConfirmDeleteBookingModal = ({
  status,
  bookingItem,
  respond,
}: ConfirmDeleteBookingModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canRespond = status === "executing" && respond != null;
  const open = status === "executing" || status === "inProgress";

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

    try {
      await respond({
        confirmed: true,
        bookingId: bookingItem.bookingId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConfirmDeleteDialog
      open={open}
      booking={{
        bookingId: bookingItem.bookingId ?? "",
        roomName: bookingItem.roomName ?? "this room",
        checkInDate: bookingItem.checkInDate ?? "",
        checkOutDate: bookingItem.checkOutDate ?? "",
        guests: bookingItem.guests,
        totalPrice: bookingItem.totalPrice,
      }}
      isDeleting={isSubmitting}
      canRespond={canRespond}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
    />
  );
};

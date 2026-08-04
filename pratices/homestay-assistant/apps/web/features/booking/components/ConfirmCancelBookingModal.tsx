"use client";

import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { ConfirmDeleteDialog } from "@/components/confirm-modal";
import { EmbeddedWidget } from "@/features/chat/components";
import { HitlDecisionUserMessage } from "@/features/booking/components/HitlDecisionUserMessage";
import { useHitlConfirmDialog } from "@/features/booking/hooks";
import { shouldRenderHitlCard } from "@/features/booking/utils";
import type { ConfirmCancelBookingResult } from "@/features/booking/schemas";
import type { BookingDetails } from "@/features/booking/types";

type ConfirmCancelBookingModalProps = {
  status: ToolCallStatus;
  bookingItem: BookingDetails;
  respond?: (result: ConfirmCancelBookingResult) => Promise<void>;
  result?: unknown;
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
  result,
}: ConfirmCancelBookingModalProps) => {
  const {
    shouldRender,
    isSubmitting,
    errorMessage,
    canRespond,
    decisionStatus,
    handleDismiss,
    confirm,
  } = useHitlConfirmDialog(
    status,
    respond,
    "Failed to cancel booking",
    result,
  );

  const hasArgs = hasRequiredBooking(bookingItem);

  if (!shouldRenderHitlCard(status, hasArgs) || !shouldRender || !hasArgs) {
    return null;
  }

  return (
    <>
      <EmbeddedWidget>
        <ConfirmDeleteDialog
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
          decisionStatus={decisionStatus}
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
      </EmbeddedWidget>
      <HitlDecisionUserMessage
        decisionStatus={decisionStatus}
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
      />
    </>
  );
};

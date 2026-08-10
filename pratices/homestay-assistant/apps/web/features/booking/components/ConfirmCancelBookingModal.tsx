"use client";

import { useRouter } from "next/navigation";
import { useAgent, ToolCallStatus } from "@copilotkit/react-core/v2";
import { AGENT_KEYS } from "@repo/constants";

import { ConfirmCancelHitlCard } from "@/components/confirm-modal";
import { EmbeddedWidget } from "@/features/chat/components";
import {
  BOOKINGS_PAGE_PATH,
  CONFIRM_CANCEL_BOOKING,
  HITL_CARD_PHASE,
} from "@/features/booking/constants";
import {
  useHitlConfirmDialog,
  useRetryCancelBooking,
} from "@/features/booking/hooks";
import { useCancelBookingCardStore } from "@/features/booking/stores/cancel-booking-card-store";
import {
  buildCancelBookingCorrelationKey,
  coalesceBookingCardOutcome,
  deriveCancelBookingOutcomeFromMessages,
  resolveHitlCardPhase,
  shouldRenderHitlCard,
} from "@/features/booking/utils";
import type { ConfirmCancelBookingResult } from "@/features/booking/schemas";
import type { BookingDetails } from "@/features/booking/types";

type ConfirmCancelBookingModalProps = {
  status: ToolCallStatus;
  bookingItem: BookingDetails;
  respond?: (result: ConfirmCancelBookingResult) => Promise<void>;
  result?: unknown;
  toolCallId?: string;
  /** Prior interaction auto-dismissed this HITL — show expired, not cancelled. */
  forceExpired?: boolean;
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
  toolCallId,
  forceExpired = false,
}: ConfirmCancelBookingModalProps) => {
  const router = useRouter();
  const { agent } = useAgent({ agentId: AGENT_KEYS.MANAGE_ASSISTANT });
  const markSubmitting = useCancelBookingCardStore(
    (state) => state.markSubmitting,
  );
  const { retryCancelBooking, isRetrying } = useRetryCancelBooking();
  const {
    shouldRender,
    isSubmitting,
    errorMessage,
    canRespond,
    isActionable,
    expiredBySupersede,
    decisionStatus,
    handleDismiss,
    confirm,
  } = useHitlConfirmDialog(
    status,
    respond,
    CONFIRM_CANCEL_BOOKING.error.confirm,
    result,
    toolCallId,
  );

  const hasArgs = hasRequiredBooking(bookingItem);
  const correlationKey = hasArgs
    ? buildCancelBookingCorrelationKey(bookingItem.bookingId)
    : null;
  const storeCancelOutcome = useCancelBookingCardStore((state) =>
    correlationKey ? (state.outcomesByCorrelationKey[correlationKey] ?? null) : null,
  );
  const cancelOutcome = coalesceBookingCardOutcome(
    storeCancelOutcome,
    deriveCancelBookingOutcomeFromMessages(agent.messages, correlationKey),
  );
  const cancelPhase =
    forceExpired || expiredBySupersede
      ? HITL_CARD_PHASE.EXPIRED
      : resolveHitlCardPhase({
          status: decisionStatus,
          isHitlSubmitting: isSubmitting,
          outcome: cancelOutcome,
        });

  const handleConfirm = () => {
    if (!bookingItem.bookingId || !correlationKey) {
      return;
    }

    markSubmitting(correlationKey);
    void confirm({
      confirmed: true,
      bookingId: bookingItem.bookingId,
    });
  };

  const handleRetry = () => {
    if (!correlationKey || isRetrying || !isActionable) {
      return;
    }

    markSubmitting(correlationKey);
    retryCancelBooking();
  };

  if (!shouldRenderHitlCard(status, hasArgs) || !shouldRender || !hasArgs) {
    return null;
  }

  return (
    <EmbeddedWidget>
      <ConfirmCancelHitlCard
        booking={{
          bookingId: bookingItem.bookingId,
          roomName: bookingItem.roomName,
          checkInDate: bookingItem.checkInDate,
          checkOutDate: bookingItem.checkOutDate,
          guests: bookingItem.guests,
          totalPrice: bookingItem.totalPrice,
        }}
        isDeleting={
          isSubmitting || cancelPhase === HITL_CARD_PHASE.SUBMITTING
        }
        canRespond={canRespond}
        decisionStatus={decisionStatus}
        cancelPhase={cancelPhase}
        failureReason={cancelOutcome?.errorMessage}
        errorMessage={errorMessage}
        onCancel={handleDismiss}
        onConfirm={handleConfirm}
        onViewBookings={
          isActionable ? () => router.push(BOOKINGS_PAGE_PATH) : undefined
        }
        onRetry={isActionable ? handleRetry : undefined}
      />
    </EmbeddedWidget>
  );
};

"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ToolCallStatus } from "@copilotkit/react-core/v2";
import { parseToolResult } from "@repo/utils";

import { useBookingStore } from "@/features/booking/stores/booking-store";
import { useModifyBookingCardStore } from "@/features/booking/stores/modify-booking-card-store";
import type {
  UpdateBookingResult,
  UpdateBookingToolProps,
} from "@/features/booking/types";
import {
  buildModifyStayCorrelationKey,
  getModifyBookingFailureMessage,
  isUpdateBookingSuccess,
} from "@/features/booking/utils";

/**
 * Headless update_booking bridge: publishes outcome to the confirm HITL card
 * store and runs success side effects. Does not render a separate success card.
 */
export const UpdateBookingNotice = ({
  status,
  result,
  parameters,
}: UpdateBookingToolProps) => {
  const queryClient = useQueryClient();
  const setPendingModifyStay = useBookingStore(
    (state) => state.setPendingModifyStay,
  );
  const markSubmitting = useModifyBookingCardStore(
    (state) => state.markSubmitting,
  );
  const markSuccess = useModifyBookingCardStore((state) => state.markSuccess);
  const markFailed = useModifyBookingCardStore((state) => state.markFailed);
  const resolveTargetCorrelationKey = useModifyBookingCardStore(
    (state) => state.resolveTargetCorrelationKey,
  );
  const sideEffectBookingId = useRef<string | null>(null);
  const lastPublishedKey = useRef<string | null>(null);

  useEffect(() => {
    const fromParams = buildModifyStayCorrelationKey({
      bookingId: parameters?.bookingId,
      checkInDate: parameters?.checkInDate,
      checkOutDate: parameters?.checkOutDate,
      guests: parameters?.guests,
    });
    const parsedResult = parseToolResult<UpdateBookingResult>(result);
    const fromResult = buildModifyStayCorrelationKey({
      bookingId: parsedResult?.id,
      checkInDate: parsedResult?.checkInDate,
      checkOutDate: parsedResult?.checkOutDate,
      guests: parsedResult?.guests,
    });
    const correlationKey = resolveTargetCorrelationKey(
      fromParams ?? fromResult,
    );

    if (!correlationKey) {
      return;
    }

    if (
      status === ToolCallStatus.Executing ||
      status === ToolCallStatus.InProgress
    ) {
      const publishKey = `${correlationKey}:submitting`;
      if (lastPublishedKey.current !== publishKey) {
        lastPublishedKey.current = publishKey;
        markSubmitting(correlationKey);
      }
      return;
    }

    if (status !== ToolCallStatus.Complete) {
      return;
    }

    if (isUpdateBookingSuccess(result)) {
      const parsed = parseToolResult<UpdateBookingResult>(result);
      const bookingId = parsed?.id?.trim() ?? parameters?.bookingId?.trim();
      if (!bookingId) {
        return;
      }

      const successCorrelationKey =
        resolveTargetCorrelationKey(
          buildModifyStayCorrelationKey({
            bookingId,
            checkInDate: parsed?.checkInDate ?? parameters?.checkInDate,
            checkOutDate: parsed?.checkOutDate ?? parameters?.checkOutDate,
            guests: parsed?.guests ?? parameters?.guests,
          }),
        ) ?? correlationKey;

      const publishKey = `${successCorrelationKey}:success:${bookingId}`;
      if (lastPublishedKey.current !== publishKey) {
        lastPublishedKey.current = publishKey;
        markSuccess(successCorrelationKey, { bookingId });
      }

      if (sideEffectBookingId.current !== bookingId) {
        sideEffectBookingId.current = bookingId;
        setPendingModifyStay(null);
        void queryClient.invalidateQueries({ queryKey: ["bookings"] });
      }
      return;
    }

    const failureMessage = getModifyBookingFailureMessage(result);
    const publishKey = `${correlationKey}:failed:${failureMessage}`;
    if (lastPublishedKey.current !== publishKey) {
      lastPublishedKey.current = publishKey;
      markFailed(correlationKey, failureMessage);
    }
  }, [
    status,
    result,
    parameters,
    markFailed,
    markSubmitting,
    markSuccess,
    queryClient,
    resolveTargetCorrelationKey,
    setPendingModifyStay,
  ]);

  return null;
};

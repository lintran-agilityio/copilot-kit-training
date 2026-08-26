"use client";

import { useLayoutEffect } from "react";
import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { parseToolResult } from "@repo/utils";
import { MODEL_NAME } from "@repo/types";

import { BookingUnavailable } from "@/components/confirm-modal";
import { EmbeddedWidget } from "@/features/chat/components";
import {
  CheckRoomAvailabilityToolProps,
  CheckRoomAvailabilityResult,
} from "@/features/booking/types";
import { useBookingStore } from "@/features/booking/stores/booking-store";
import {
  canRenderBookingUnavailableCard,
  getAvailabilityFailureReason,
  isCheckRoomAvailabilityFailure,
} from "@/features/booking/utils";

/**
 * On successful modify availability, stash the proposed stay + originals so
 * confirm_modify_booking can render old → new diffs even when the model omits
 * original* args (stated-change path never opens the edit form).
 */
const useStashPendingModifyFromAvailability = (
  status: CheckRoomAvailabilityToolProps["status"],
  result: CheckRoomAvailabilityToolProps["result"],
) => {
  const setPendingModifyStay = useBookingStore(
    (state) => state.setPendingModifyStay,
  );

  useLayoutEffect(() => {
    if (status !== ToolCallStatus.Complete) {
      return;
    }

    const availabilityResult =
      parseToolResult<CheckRoomAvailabilityResult>(result);

    if (!availabilityResult || availabilityResult.flow !== MODEL_NAME.MODIFY) {
      return;
    }

    if (isCheckRoomAvailabilityFailure(result)) {
      setPendingModifyStay(null);
      return;
    }

    const bookingId = availabilityResult.bookingId?.trim();
    const checkInDate = availabilityResult.checkInDate?.trim();
    const checkOutDate = availabilityResult.checkOutDate?.trim();
    const guests = Number(availabilityResult.guests);
    const originalCheckInDate = availabilityResult.originalCheckInDate?.trim();
    const originalCheckOutDate = availabilityResult.originalCheckOutDate?.trim();
    const originalGuests = Number(availabilityResult.originalGuests);

    if (
      !bookingId ||
      !checkInDate ||
      !checkOutDate ||
      !Number.isFinite(guests) ||
      guests <= 0 ||
      !originalCheckInDate ||
      !originalCheckOutDate ||
      !Number.isFinite(originalGuests) ||
      originalGuests <= 0
    ) {
      return;
    }

    setPendingModifyStay({
      bookingId,
      checkInDate,
      checkOutDate,
      guests,
      original: {
        checkInDate: originalCheckInDate,
        checkOutDate: originalCheckOutDate,
        guests: originalGuests,
      },
    });
  }, [status, result, setPendingModifyStay]);
};

export const BookingUnavailableNotice = ({
  status,
  result,
}: CheckRoomAvailabilityToolProps) => {
  useStashPendingModifyFromAvailability(status, result);

  const availabilityResult = parseToolResult<CheckRoomAvailabilityResult>(result);

  if (
    status !== ToolCallStatus.Complete ||
    !canRenderBookingUnavailableCard(result)
  ) {
    return null;
  }

  const reason = getAvailabilityFailureReason(result);
  const roomName = availabilityResult?.room?.name?.trim();
  const checkInDate = availabilityResult?.checkInDate?.trim();
  const checkOutDate = availabilityResult?.checkOutDate?.trim();
  const guests = Number(availabilityResult?.guests);

  if (
    !reason ||
    !roomName ||
    !checkInDate ||
    !checkOutDate ||
    !Number.isFinite(guests) ||
    guests <= 0
  ) {
    return null;
  }

  return (
    <EmbeddedWidget>
      <BookingUnavailable
        roomName={roomName}
        checkInDate={checkInDate}
        checkOutDate={checkOutDate}
        guests={guests}
        reason={reason}
        capacity={availabilityResult?.room?.capacity}
      />
    </EmbeddedWidget>
  );
};

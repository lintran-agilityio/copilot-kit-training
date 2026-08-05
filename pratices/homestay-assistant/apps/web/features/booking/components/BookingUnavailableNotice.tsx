"use client";

import { useEffect } from "react";
import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { BookingUnavailable } from "@/components/confirm-modal";
import { EmbeddedWidget } from "@/features/chat/components";
import { parseToolResult } from "@repo/utils";
import { CheckRoomAvailabilityToolProps, CheckRoomAvailabilityResult } from "@/features/booking/types";
import { useBookingStore } from "@/features/booking/stores/booking-store";
import {
  canRenderBookingUnavailableCard,
  getAvailabilityFailureReason,
  isCheckRoomAvailabilityFailure,
} from "@/features/booking/utils";

export const BookingUnavailableNotice = ({
  status,
  result,
}: CheckRoomAvailabilityToolProps) => {
  const setPendingModifyStay = useBookingStore(
    (state) => state.setPendingModifyStay,
  );
  const availabilityResult = parseToolResult<CheckRoomAvailabilityResult>(result);

  // A failed modify check ends the flow, so confirm_modify_booking never opens
  // to clear the stay the edit form stashed. Dropping it here stops those
  // values from leaking into the guest's next modify of the same booking.
  const isModifyFailure =
    status === ToolCallStatus.Complete &&
    availabilityResult?.flow === "modify" &&
    isCheckRoomAvailabilityFailure(result);

  useEffect(() => {
    if (isModifyFailure) {
      setPendingModifyStay(null);
    }
  }, [isModifyFailure, setPendingModifyStay]);

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

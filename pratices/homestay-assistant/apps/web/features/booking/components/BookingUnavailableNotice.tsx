"use client";

import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { BookingUnavailable } from "@/components/confirm-modal";
import { parseToolResult } from "@repo/utils";
import { CheckRoomAvailabilityToolProps, CheckRoomAvailabilityResult } from "@/features/booking/types";
import {
  getAvailabilityFailureReason,
  isCheckRoomAvailabilityFailure,
} from "@/features/booking/utils";

export const BookingUnavailableNotice = ({
  status,
  result,
}: CheckRoomAvailabilityToolProps) => {
  if (
    status !== ToolCallStatus.Complete ||
    !isCheckRoomAvailabilityFailure(result)
  ) {
    return null;
  }

  const availabilityResult = parseToolResult<CheckRoomAvailabilityResult>(result);
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
    <BookingUnavailable
      roomName={roomName}
      checkInDate={checkInDate}
      checkOutDate={checkOutDate}
      guests={guests}
      reason={reason}
      capacity={availabilityResult?.room?.capacity}
    />
  );
};

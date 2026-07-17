"use client";

import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { BookingUnavailable } from "@/components/confirm-modal";
import { parseToolResult } from "@repo/utils";
import type {
  CheckRoomAvailabilityResult,
  CheckRoomAvailabilityToolProps,
} from "@/features/ai-elements/type";
import {
  getAvailabilityFailureReason,
  isCheckRoomAvailabilityFailure,
} from "@/features/ai-elements/utils";

export const CheckRoomAvailabilityToolRenderer = ({
  status,
  result,
}: CheckRoomAvailabilityToolProps) => {
  if (
    status !== ToolCallStatus.Complete ||
    !isCheckRoomAvailabilityFailure(result)
  ) {
    return null;
  }

  const parsed = parseToolResult<CheckRoomAvailabilityResult>(result);
  const reason = getAvailabilityFailureReason(result);
  const roomName = parsed?.room?.name?.trim();
  const checkInDate = parsed?.checkInDate?.trim();
  const checkOutDate = parsed?.checkOutDate?.trim();
  const guests = Number(parsed?.guests);

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
      capacity={parsed?.room?.capacity}
    />
  );
};

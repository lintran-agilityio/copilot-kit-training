"use client";

import { useEffect, useRef } from "react";
import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { BookingUnavailable } from "@/components/confirm-modal";
import {
  isHitlToolAwaitingUser,
  isHitlToolFinished,
} from "@/features/booking/copilot/utils/hitl-tool-status";
import type {
  ShowBookingUnavailableArgs,
  ShowBookingUnavailableResult,
} from "@/features/booking/schemas";

type BookingUnavailableModalProps = {
  status: ToolCallStatus;
  args: Partial<ShowBookingUnavailableArgs>;
  respond?: (result: ShowBookingUnavailableResult) => Promise<void>;
};

const hasRequiredArgs = (args: Partial<ShowBookingUnavailableArgs>) =>
  Boolean(
    args.roomName?.trim() &&
      args.checkInDate?.trim() &&
      args.checkOutDate?.trim() &&
      typeof args.guests === "number" &&
      args.guests > 0 &&
      args.reason,
  );

export const BookingUnavailableModal = ({
  status,
  args,
  respond,
}: BookingUnavailableModalProps) => {
  const acknowledged = useRef(false);

  const ready = hasRequiredArgs(args);
  const roomName = args.roomName?.trim() ?? "";
  const reason = args.reason;

  useEffect(() => {
    if (
      !ready ||
      !reason ||
      !respond ||
      !isHitlToolAwaitingUser(status) ||
      acknowledged.current
    ) {
      return;
    }

    acknowledged.current = true;
    void respond({
      acknowledged: true,
      reason,
      roomName,
    });
  }, [ready, reason, respond, status, roomName]);

  if (!ready || !reason) {
    return null;
  }

  if (!isHitlToolAwaitingUser(status) && !isHitlToolFinished(status)) {
    return null;
  }

  return (
    <BookingUnavailable
      roomName={roomName}
      checkInDate={args.checkInDate!.trim()}
      checkOutDate={args.checkOutDate!.trim()}
      guests={args.guests!}
      reason={reason}
      capacity={args.capacity}
    />
  );
};

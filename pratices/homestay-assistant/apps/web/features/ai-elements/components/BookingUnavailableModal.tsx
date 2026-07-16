"use client";

import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { BookingUnavailableDialog } from "@/components/confirm-modal";
import {
  isHitlToolAwaitingUser,
  isHitlToolFinished,
} from "@/features/ai-elements/utils/hitl-tool-status";
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
  if (isHitlToolFinished(status) || !isHitlToolAwaitingUser(status)) {
    return null;
  }

  if (!hasRequiredArgs(args)) {
    return null;
  }

  const canRespond = respond != null;
  const roomName = args.roomName!;
  const checkInDate = args.checkInDate!;
  const checkOutDate = args.checkOutDate!;
  const guests = args.guests!;
  const reason = args.reason!;
  const capacity = args.capacity;

  const acknowledge = () => {
    if (!canRespond) {
      return;
    }

    void respond({
      acknowledged: true,
      reason,
      roomName,
    });
  };

  return (
    <BookingUnavailableDialog
      open
      roomName={roomName}
      checkInDate={checkInDate}
      checkOutDate={checkOutDate}
      guests={guests}
      reason={reason}
      capacity={capacity}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          acknowledge();
        }
      }}
    />
  );
};

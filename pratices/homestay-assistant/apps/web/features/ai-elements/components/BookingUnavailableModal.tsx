"use client";

import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { BookingUnavailableDialog } from "@/components/confirm-modal";
import type {
  ShowBookingUnavailableArgs,
  ShowBookingUnavailableResult,
} from "@/features/booking/schemas";

type BookingUnavailableModalProps = {
  status: ToolCallStatus;
  args: Partial<ShowBookingUnavailableArgs>;
  respond?: (result: ShowBookingUnavailableResult) => Promise<void>;
};

export const BookingUnavailableModal = ({
  status,
  args,
  respond,
}: BookingUnavailableModalProps) => {
  const canRespond = status === "executing" && respond != null;
  const open = status === "executing" || status === "inProgress";

  const roomName = args.roomName ?? "This room";
  const checkInDate = args.checkInDate ?? "";
  const checkOutDate = args.checkOutDate ?? "";
  const guests = args.guests ?? 0;
  const reason = args.reason ?? "dates_unavailable";
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

  if (status === ToolCallStatus.Complete) {
    return null;
  }

  return (
    <BookingUnavailableDialog
      open={open}
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

"use client";

import { BookingUnavailableDialog } from "@/components/confirm-modal";
import type { ShowBookingUnavailableArgs } from "@/features/booking/schemas";

type BookingUnavailableModalProps = {
  open: boolean;
  notice: ShowBookingUnavailableArgs;
  onOpenChange: (open: boolean) => void;
};

export const BookingUnavailableModal = ({
  open,
  notice,
  onOpenChange,
}: BookingUnavailableModalProps) => (
  <BookingUnavailableDialog
    open={open}
    roomName={notice.roomName}
    checkInDate={notice.checkInDate}
    checkOutDate={notice.checkOutDate}
    guests={notice.guests}
    reason={notice.reason}
    capacity={notice.capacity}
    onOpenChange={onOpenChange}
  />
);

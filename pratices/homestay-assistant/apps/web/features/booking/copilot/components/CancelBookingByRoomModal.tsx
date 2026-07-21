"use client";

import { useState } from "react";
import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmCancelBookingModal } from "./ConfirmCancelBookingModal";
import {
  isHitlToolAwaitingUser,
  isHitlToolFinished,
} from "@/features/booking/copilot/utils/hitl-tool-status";
import type {
  CancelBookingByRoomArgs,
  CancelBookingByRoomResult,
} from "@/features/booking/schemas";
import type { BookingDetails } from "@/features/booking/types";

type CancelBookingByRoomModalProps = {
  status: ToolCallStatus;
  args: Partial<CancelBookingByRoomArgs>;
  respond?: (result: CancelBookingByRoomResult) => Promise<void>;
  result?: CancelBookingByRoomResult;
};

type BookingItem = CancelBookingByRoomArgs["bookings"][number];

const toBookingDetails = (booking: BookingItem): BookingDetails => ({
  bookingId: booking.bookingId,
  roomName: booking.roomName,
  checkInDate: booking.checkInDate,
  checkOutDate: booking.checkOutDate,
  guests: booking.guests,
  totalPrice: booking.totalPrice,
});

const hasValidBooking = (booking: BookingItem) =>
  Boolean(
    booking.bookingId?.trim() &&
      booking.roomName?.trim() &&
      booking.checkInDate?.trim() &&
      booking.checkOutDate?.trim(),
  );

export const CancelBookingByRoomModal = ({
  status,
  args,
  respond,
  result,
}: CancelBookingByRoomModalProps) => {
  const [selectedBooking, setSelectedBooking] = useState<BookingDetails | null>(
    null,
  );

  if (isHitlToolFinished(status)) {
    return null;
  }

  if (!isHitlToolAwaitingUser(status)) {
    return null;
  }

  const canRespond = respond != null;
  const bookings = (args.bookings ?? []).filter(hasValidBooking);

  if (!bookings.length) {
    return null;
  }

  const handleOpenDialogCancelBooking = (nextOpen: boolean) => {
    if (!nextOpen && canRespond) {
      void respond?.({ confirmed: false, reason: "declined" });
    }
  };

  const handleKeepBookings = () => {
    void respond?.({ confirmed: false, reason: "declined" });
  };

  const confirmRespond = (bookingItem: BookingDetails) =>
    respond
      ? async (cancelResult: { confirmed: boolean; bookingId?: string }) => {
          if (cancelResult.confirmed && cancelResult.bookingId) {
            await respond({
              confirmed: true,
              bookingId: cancelResult.bookingId,
              roomName: bookingItem.roomName,
            });
            return;
          }

          await respond({ confirmed: false, reason: "declined" });
        }
      : undefined;

  if (bookings.length === 1 && bookings[0]) {
    return (
      <ConfirmCancelBookingModal
        status={status}
        bookingItem={toBookingDetails(bookings[0])}
        respond={confirmRespond(toBookingDetails(bookings[0]))}
      />
    );
  }

  if (selectedBooking) {
    return (
      <ConfirmCancelBookingModal
        status={status}
        bookingItem={selectedBooking}
        respond={confirmRespond(selectedBooking)}
      />
    );
  }

  return (
    <Dialog open onOpenChange={handleOpenDialogCancelBooking}>
      <DialogContent className="border-white/10 bg-[#111111] text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-medium text-white">
            Which booking should be cancelled?
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-400">
            Multiple bookings match &ldquo;{args.queryName}&rdquo;. Select one to
            cancel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {bookings.map((booking) => (
            <button
              key={booking.bookingId}
              type="button"
              disabled={!canRespond}
              className="flex w-full flex-col rounded-xl border border-white/8 bg-white/[0.02] p-4 text-left text-sm transition hover:bg-white/[0.05] disabled:opacity-50"
              onClick={() => setSelectedBooking(toBookingDetails(booking))}
            >
              <span className="font-medium text-zinc-100">{booking.roomName}</span>
              <span className="text-zinc-400">
                {booking.checkInDate} → {booking.checkOutDate}
              </span>
            </button>
          ))}
        </div>

        <DialogFooter className="border-white/8 bg-transparent">
          <Button
            type="button"
            variant="outline"
            className="border-white/10 bg-transparent text-zinc-200 hover:bg-white/5 hover:text-white"
            disabled={!canRespond}
            onClick={handleKeepBookings}
          >
            Keep bookings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

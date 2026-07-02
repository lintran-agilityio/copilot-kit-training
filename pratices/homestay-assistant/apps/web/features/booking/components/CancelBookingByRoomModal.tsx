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
import type {
  CancelBookingByRoomArgs,
  CancelBookingByRoomResult,
} from "../schemas";
import type { BookingDetails } from "../types";
import { ConfirmDeleteBookingModal } from "./ConfirmDeleteBookingModal";

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

export const CancelBookingByRoomModal = ({
  status,
  args,
  respond,
  result,
}: CancelBookingByRoomModalProps) => {
  const [selectedBooking, setSelectedBooking] = useState<BookingDetails | null>(
    null,
  );
  const canRespond = status === "executing" && respond != null;
  const open = status === "executing" || status === "inProgress";
  const bookings = args.bookings ?? [];

  const handleClose = () => {
    respond?.({ confirmed: false, reason: "not_found" })
  };

  const handleOpenChangeNotFound = (nextOpen: boolean) => {
    if (!nextOpen && canRespond) {
      respond?.({ confirmed: false, reason: "not_found" });
    }
  };

  const handleOpenDialogCancelBooking = (nextOpen: boolean) => {
    if (!nextOpen && canRespond) {
      respond?.({ confirmed: false, reason: "declined" });
    }
  };

  const handleKeepBookings = () => {
    respond?.({ confirmed: false, reason: "declined" })
  };


  if (status === ToolCallStatus.Complete && result?.confirmed) {
    return null;
  }

  const confirmRespond = (bookingItem: BookingDetails) =>
    respond
      ? async (deleteResult: { confirmed: boolean; bookingId?: string }) => {
          if (deleteResult.confirmed && deleteResult.bookingId) {
            await respond({
              confirmed: true,
              bookingId: deleteResult.bookingId,
              roomName: bookingItem.roomName,
            });
            return;
          }

          await respond({ confirmed: false, reason: "declined" });
        }
      : undefined;

  if (!bookings.length) {
    return (
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => handleOpenChangeNotFound(nextOpen)}
      >
        <DialogContent className="border-white/10 bg-[#111111] text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Booking not found</DialogTitle>
            <DialogDescription className="text-zinc-400">
              No active booking found
              {args.queryName ? ` for "${args.queryName}"` : ""}.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="border-white/8 bg-transparent">
            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-transparent text-zinc-200 hover:bg-white/5 hover:text-white"
              disabled={!canRespond}
              onClick={handleClose}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (bookings.length === 1 && bookings[0]) {
    return (
      <ConfirmDeleteBookingModal
        status={status}
        bookingItem={toBookingDetails(bookings[0])}
        respond={confirmRespond(toBookingDetails(bookings[0]))}
      />
    );
  }

  if (selectedBooking) {
    return (
      <ConfirmDeleteBookingModal
        status={status}
        bookingItem={selectedBooking}
        respond={confirmRespond(selectedBooking)}
      />
    );
  }

  if (bookings.length > 1) {
    return (
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => handleOpenDialogCancelBooking(nextOpen)}
      >
        <DialogContent className="border-white/10 bg-[#111111] text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-medium text-base">
              Which booking should be cancelled?
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              Multiple bookings match &ldquo;{args.queryName}&rdquo;. Select one
              to cancel.
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
                <span className="font-medium text-zinc-100">
                  {booking.roomName}
                </span>
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
  }

  return (
    <Dialog open={open}>
      <DialogContent className="border-white/10 bg-[#111111] text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Preparing cancellation…</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Waiting for booking details from the assistant.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

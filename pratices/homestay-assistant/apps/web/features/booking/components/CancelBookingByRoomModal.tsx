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
} from "../schemas/cancel-booking-by-room-schema";
import type { BookingDetails } from "../types";
import { ConfirmDeleteBookingModal } from "./ConfirmDeleteBookingModal";
import { ConfirmDeleteSuccessModal } from "./ConfirmDeleteSuccessModal";

type CancelBookingByRoomModalProps = {
  status: ToolCallStatus;
  args: Partial<CancelBookingByRoomArgs>;
  respond?: (result: CancelBookingByRoomResult) => Promise<void>;
  result?: CancelBookingByRoomResult;
};

const toBookingDetails = (booking: CancelBookingByRoomArgs["booking"]): BookingDetails => ({
  bookingId: booking!.bookingId,
  roomName: booking!.roomName,
  checkInDate: booking!.checkInDate,
  checkOutDate: booking!.checkOutDate,
  guests: booking!.guests,
  totalPrice: booking!.totalPrice,
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

  if (status === ToolCallStatus.Complete && result?.confirmed) {
    return <ConfirmDeleteSuccessModal />;
  }

  if (!args.status) {
    return (
      <Dialog open={open}>
        <DialogContent className="border-white/10 bg-[#111111] text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Preparing cancellation…</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {args.message ?? "Waiting for booking details from the assistant."}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  if (args.status === "found" && args.booking) {
    return (
      <ConfirmDeleteBookingModal
        status={status}
        bookingItem={toBookingDetails(args.booking)}
        respond={
          respond
            ? async (deleteResult) => {
                if (deleteResult.confirmed) {
                  await respond({
                    confirmed: true,
                    bookingId: deleteResult.bookingId,
                    roomName: args.booking!.roomName,
                  });
                  return;
                }

                await respond({ confirmed: false, reason: "declined" });
              }
            : undefined
        }
      />
    );
  }

  if (args.status === "ambiguous" && selectedBooking) {
    return (
      <ConfirmDeleteBookingModal
        status={status}
        bookingItem={selectedBooking}
        respond={
          respond
            ? async (deleteResult) => {
                if (deleteResult.confirmed) {
                  await respond({
                    confirmed: true,
                    bookingId: deleteResult.bookingId,
                    roomName: selectedBooking.roomName,
                  });
                  return;
                }

                await respond({ confirmed: false, reason: "declined" });
              }
            : undefined
        }
      />
    );
  }

  if (args.status === "ambiguous" && args.candidates?.length) {
    return (
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && canRespond) {
            void respond?.({
              confirmed: false,
              reason: "ambiguous",
              message: args.message,
            });
          }
        }}
      >
        <DialogContent className="border-white/10 bg-[#111111] text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              Which booking should be cancelled?
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {args.message}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {args.candidates.map((booking) => (
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
              onClick={() =>
                void respond?.({
                  confirmed: false,
                  reason: "ambiguous",
                  message: args.message,
                })
              }
            >
              Keep bookings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (args.status === "not_found") {
    return (
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && canRespond) {
            void respond?.({
              confirmed: false,
              reason: "not_found",
              message: args.message,
            });
          }
        }}
      >
        <DialogContent className="border-white/10 bg-[#111111] text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Booking not found</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {args.message}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="border-white/8 bg-transparent">
            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-transparent text-zinc-200 hover:bg-white/5 hover:text-white"
              disabled={!canRespond}
              onClick={() =>
                void respond?.({
                  confirmed: false,
                  reason: "not_found",
                  message: args.message,
                })
              }
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
};

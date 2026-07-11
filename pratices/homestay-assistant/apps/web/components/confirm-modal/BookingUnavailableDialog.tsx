"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BookingUnavailableReason } from "@/features/booking/schemas";

export type BookingUnavailableDialogProps = {
  open: boolean;
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  reason: BookingUnavailableReason;
  capacity?: number;
  onOpenChange: (open: boolean) => void;
};

const mappingReason = (
  reason: BookingUnavailableReason,
  roomName: string,
  capacity?: number,
) => {
  if (reason === "capacity_exceeded") {
    const maxLabel =
      capacity != null ? `up to ${capacity} guest${capacity === 1 ? "" : "s"}` : "fewer guests";
    return {
      title: "Too many guests",
      description: (
        <>
          <span className="font-medium text-zinc-200">{roomName}</span> fits{" "}
          {maxLabel}. Try fewer guests or a larger room.
        </>
      ),
    };
  }

  return {
    title: "This stay isn’t available",
    description: (
      <>
        <span className="font-medium text-zinc-200">{roomName}</span> isn’t free
        for these dates. Try different dates or another room.
      </>
    ),
  };
};

export const BookingUnavailableDialog = ({
  open,
  roomName,
  checkInDate,
  checkOutDate,
  guests,
  reason,
  capacity,
  onOpenChange,
}: BookingUnavailableDialogProps) => {
  const { title, description } = mappingReason(reason, roomName, capacity);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border-white/10 bg-[#111111] text-zinc-100 sm:max-w-md"
      >
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
              <AlertTriangle className="size-5" />
            </div>
            <div className="space-y-1.5">
              <DialogTitle className="text-lg font-medium text-white">
                {title}
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <dl className="space-y-2 rounded-xl border border-white/8 bg-white/[0.02] p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Room</dt>
            <dd className="text-right text-zinc-100">{roomName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Dates</dt>
            <dd className="text-right text-zinc-100">
              {checkInDate} → {checkOutDate}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Guests</dt>
            <dd className="text-right text-zinc-100">{guests}</dd>
          </div>
          {reason === "capacity_exceeded" && capacity != null ? (
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Max guests</dt>
              <dd className="text-right text-zinc-100">{capacity}</dd>
            </div>
          ) : null}
        </dl>

        <DialogFooter className="border-white/8 bg-transparent">
          <Button
            type="button"
            className="w-full bg-zinc-100 text-zinc-900 hover:bg-white"
            onClick={() => onOpenChange(false)}
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

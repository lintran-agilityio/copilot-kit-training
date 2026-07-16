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
import { formatPrice } from "@repo/utils";
import { BookingDetails } from "@/features/booking/types";

export type ConfirmDeleteDialogProps = {
  open: boolean;
  booking: BookingDetails;
  isDeleting?: boolean;
  canRespond?: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export const ConfirmDeleteDialog = ({
  open,
  booking,
  isDeleting = false,
  canRespond = true,
  errorMessage = null,
  onCancel,
  onConfirm,
}: ConfirmDeleteDialogProps) => {
  const actionsDisabled = !canRespond || isDeleting;
  const { roomName, checkInDate, checkOutDate, guests, totalPrice } = booking;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && canRespond && !isDeleting) {
          onCancel();
        }
      }}
    >
      <DialogContent
        showCloseButton={!isDeleting}
        className="border-white/10 bg-[#111111] text-zinc-100 sm:max-w-md"
      >
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
            <div className="space-y-1.5">
              <DialogTitle className="text-white font-medium text-lg">
                Cancel this booking?
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                This will cancel your reservation for{" "}
                <span className="font-medium text-zinc-200">{roomName}</span>.
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <dl className="space-y-2 rounded-xl border border-white/8 bg-white/[0.02] p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Dates</dt>
            <dd className="text-right text-zinc-100">
              {checkInDate} → {checkOutDate}
            </dd>
          </div>
          {guests ? (
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Guests</dt>
              <dd className="text-right text-zinc-100">{guests}</dd>
            </div>
          ) : null}
          {totalPrice ? (
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Total</dt>
              <dd className="text-right font-medium text-emerald-300">
                {formatPrice(totalPrice)}
              </dd>
            </div>
          ) : null}
        </dl>

        {errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : null}

        <DialogFooter className="border-white/8 bg-transparent">
          <Button
            type="button"
            variant="outline"
            className="border-white/10 bg-transparent text-zinc-200 hover:bg-white/5 hover:text-white"
            disabled={actionsDisabled}
            onClick={onCancel}
          >
            Keep booking
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={actionsDisabled}
            onClick={onConfirm}
          >
            {isDeleting ? "Cancelling…" : "Cancel booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

"use client";

import { CalendarCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { countNightOfDates, formatPrice } from "@repo/utils";

export type ConfirmBookingDialogProps = {
  open: boolean;
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  pricePerNight: number;
  isSubmitting?: boolean;
  canRespond?: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export const ConfirmBookingDialog = ({
  open,
  roomName,
  checkInDate,
  checkOutDate,
  guests,
  pricePerNight,
  isSubmitting = false,
  canRespond = true,
  errorMessage = null,
  onCancel,
  onConfirm,
}: ConfirmBookingDialogProps) => {
  const actionsDisabled = !canRespond || isSubmitting;
  const nights = countNightOfDates(checkInDate, checkOutDate);
  const totalPrice = nights * pricePerNight;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && canRespond && !isSubmitting) {
          onCancel();
        }
      }}
    >
      <DialogContent
        showCloseButton={!isSubmitting}
        className="border-white/10 bg-[#111111] text-zinc-100 sm:max-w-md"
      >
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <CalendarCheck className="size-5" />
            </div>
            <div className="space-y-1.5">
              <DialogTitle className="text-lg font-medium text-white">
                Confirm your booking?
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Review the details below before confirming your stay at{" "}
                <span className="font-medium text-zinc-200">{roomName}</span>.
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
          <div className="flex justify-between gap-4 border-t border-white/8 pt-2">
            <dt className="text-zinc-500">Total</dt>
            <dd className="text-right font-medium text-emerald-300">
              {formatPrice(totalPrice)}
            </dd>
          </div>
        </dl>

        {errorMessage ? (
          <p className="text-sm text-red-400">{errorMessage}</p>
        ) : null}

        <DialogFooter className="gap-2 border-white/8 bg-transparent sm:gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-white/10 bg-transparent text-zinc-200 hover:bg-white/5 hover:text-white"
            disabled={actionsDisabled}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="gap-2 bg-emerald-500 text-black hover:bg-emerald-400"
            disabled={actionsDisabled}
            onClick={onConfirm}
          >
            <CalendarCheck className="size-4" />
            {isSubmitting ? "Confirming…" : "Confirm booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

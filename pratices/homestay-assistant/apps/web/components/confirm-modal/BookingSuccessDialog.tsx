"use client";

import { CheckCircle2 } from "lucide-react";

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

export type BookingSuccessDialogProps = {
  open: boolean;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  totalPrice: number;
  onOpenChange: (open: boolean) => void;
};

export const BookingSuccessDialog = ({
  open,
  checkInDate,
  checkOutDate,
  guests,
  totalPrice,
  onOpenChange,
}: BookingSuccessDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#111111] text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="size-5" />
            </div>
            <div className="space-y-1.5">
              <DialogTitle className="text-lg font-medium text-white">
                Booking confirmed
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Your stay is booked. Here are the details.
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

        <DialogFooter className="border-white/8 bg-transparent">
          <Button
            type="button"
            className="w-full bg-emerald-500 text-black hover:bg-emerald-400"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

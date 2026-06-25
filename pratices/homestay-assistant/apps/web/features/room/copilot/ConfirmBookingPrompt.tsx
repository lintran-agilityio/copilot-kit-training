"use client";

import type { z } from "zod";

import { cn } from "@repo/utils";

import type { confirmBookingSchema } from "../schemas/booking-schemas";

type ConfirmBookingArgs = z.infer<typeof confirmBookingSchema>;

type ConfirmBookingPromptProps = {
  args: ConfirmBookingArgs;
  disabled: boolean;
  onApprove: () => void;
  onDeny: () => void;
};

export const ConfirmBookingPrompt = ({
  args,
  disabled,
  onApprove,
  onDeny,
}: ConfirmBookingPromptProps) => (
  <div
    className={cn(
      "rounded-xl border border-white/10 bg-zinc-900/90 p-4 text-sm text-zinc-100",
    )}
  >
    <p className="font-medium">Confirm booking</p>
    <p className="mt-2 text-zinc-400">
      {args.roomName} · {args.checkInDate} → {args.checkOutDate} ·{" "}
      {args.guests} guest{args.guests === 1 ? "" : "s"}
    </p>
    <p className="mt-1 text-zinc-300">${args.totalPrice.toLocaleString()} total</p>
    <div className="mt-4 flex gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={onDeny}
        className="rounded-lg border border-white/15 px-3 py-1.5 text-zinc-300 transition hover:border-white/25 disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onApprove}
        className="rounded-lg bg-zinc-100 px-3 py-1.5 font-medium text-zinc-900 transition hover:bg-white disabled:opacity-50"
      >
        Confirm
      </button>
    </div>
  </div>
);

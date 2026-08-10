"use client";

import { formatPrice, formatShortDateForDisplay } from "@repo/utils";

export type StaySummaryProps = {
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  guests?: number;
  totalPrice?: number;
};

/**
 * Shared stay details summary for HITL confirm cards (create / cancel / fallbacks).
 */
export const StaySummary = ({
  roomName,
  checkInDate,
  checkOutDate,
  guests,
  totalPrice,
}: StaySummaryProps) => (
  <dl className="space-y-1.5 rounded-lg border border-white/8 bg-white/[0.02] p-3 text-xs">
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-500">Room</dt>
      <dd className="text-right text-zinc-100">{roomName}</dd>
    </div>
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-500">Dates</dt>
      <dd className="text-right text-zinc-100">
        {formatShortDateForDisplay(checkInDate)} →{" "}
        {formatShortDateForDisplay(checkOutDate)}
      </dd>
    </div>
    {guests != null ? (
      <div className="flex justify-between gap-4">
        <dt className="text-zinc-500">Guests</dt>
        <dd className="text-right text-zinc-100">{guests}</dd>
      </div>
    ) : null}
    {totalPrice != null ? (
      <div className="flex justify-between gap-4 border-t border-white/8 pt-1.5">
        <dt className="text-zinc-500">Total</dt>
        <dd className="text-right font-medium text-emerald-300">
          {formatPrice(totalPrice)}
        </dd>
      </div>
    ) : null}
  </dl>
);

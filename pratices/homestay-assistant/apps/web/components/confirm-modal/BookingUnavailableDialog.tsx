"use client";

import { AlertTriangle } from "lucide-react";

import type { BookingUnavailableReason } from "@/features/booking/schemas";

export type BookingUnavailableProps = {
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  reason: BookingUnavailableReason;
  capacity?: number;
};

const mappingReason = (
  reason: BookingUnavailableReason,
  roomName: string,
  capacity?: number,
) => {
  if (reason === "capacity_exceeded") {
    const maxLabel =
      capacity != null
        ? `up to ${capacity} guest${capacity === 1 ? "" : "s"}`
        : "fewer guests";
    return {
      title: "Too many guests",
      description: `${roomName} fits ${maxLabel}. Try fewer guests or a larger room.`,
    };
  }

  return {
    title: "This stay isn’t available",
    description: `${roomName} isn’t free for these dates. Try different dates or another room.`,
  };
};

export const BookingUnavailable = ({
  roomName,
  checkInDate,
  checkOutDate,
  guests,
  reason,
  capacity,
}: BookingUnavailableProps) => {
  const { title, description } = mappingReason(reason, roomName, capacity);

  return (
    <div className="p-3.5">
      <div className="flex items-start gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
          <AlertTriangle className="size-4 text-amber-400" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="text-sm font-medium text-amber-300">{title}</h3>
          <p className="text-xs leading-relaxed text-zinc-400">{description}</p>

          <dl className="mt-2 space-y-0.5 border-t border-white/8 pt-2 text-xs text-zinc-300">
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Room</dt>
              <dd className="truncate text-right">{roomName}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Dates</dt>
              <dd className="text-right">
                {checkInDate} → {checkOutDate}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Guests</dt>
              <dd className="text-right">{guests}</dd>
            </div>
            {reason === "capacity_exceeded" && capacity != null ? (
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-500">Max guests</dt>
                <dd className="text-right">{capacity}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </div>
  );
};

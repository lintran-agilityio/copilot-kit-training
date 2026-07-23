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
      capacity != null ? `up to ${capacity} guest${capacity === 1 ? "" : "s"}` : "fewer guests";
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
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 h-12 w-12">
          <AlertTriangle className="h-9 w-9 text-amber-600 dark:text-amber-500" />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="font-medium text-amber-900 text-lg">{title}</h3>
          <p className="mt-1 text-base text-amber-700">{description}</p>

          <dl className="mt-2 space-y-1 text-base text-amber-600">
            <div className="flex justify-between gap-4">
              <dt>Room</dt>
              <dd className="text-right">{roomName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Dates</dt>
              <dd className="text-right">
                {checkInDate} → {checkOutDate}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Guests</dt>
              <dd className="text-right">{guests}</dd>
            </div>
            {reason === "capacity_exceeded" && capacity != null ? (
              <div className="flex justify-between gap-4">
                <dt>Max guests</dt>
                <dd className="text-right">{capacity}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </div>
  );
};

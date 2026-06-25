"use client";

import {
  addDays,
  startOfDay,
  parseDateKey,
  toDateKey,
} from "@repo/utils";
import { DateSelected } from "./DateSelected";

type RoomBookingDatesProps = {
  checkInDate: string | null;
  checkOutDate: string | null;
  onCheckInChange: (dateKey: string) => void;
  onCheckOutChange: (dateKey: string) => void;
};

export const RoomBookingDates = ({
  checkInDate,
  checkOutDate,
  onCheckInChange,
  onCheckOutChange,
}: RoomBookingDatesProps) => {
  const checkIn = checkInDate ? parseDateKey(checkInDate) : null;
  const checkOut = checkOutDate ? parseDateKey(checkOutDate) : null;
  const minCheckOut = checkIn ? addDays(checkIn, 1) : startOfDay(new Date());

  return (
    <div className="space-y-4 rounded-xl border border-white/8 bg-white/[0.02] p-4">
      <p className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">
        Select dates
      </p>

      <DateSelected
        label="Check-in"
        selectedDate={checkIn}
        minDate={startOfDay(new Date())}
        onSelect={(date) => onCheckInChange(toDateKey(date))}
      />

      <DateSelected
        label="Check-out"
        selectedDate={checkOut}
        minDate={minCheckOut}
        onSelect={(date) => onCheckOutChange(toDateKey(date))}
      />
    </div>
  );
};

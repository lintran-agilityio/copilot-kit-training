"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { addDays, startOfDay, cn } from "@repo/utils";

import { CalendarDateButton } from "@/components/calendar/CalendarDateButton";

type ScheduleCalendarProps = {
  initialDate?: Date;
  daysToShow?: number;
  onDateChange?: (date: Date) => void;
  className?: string;
};

export const ScheduleCalendar = ({
  initialDate = new Date(),
  daysToShow = 7,
  onDateChange,
  className,
}: ScheduleCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState(() =>
    startOfDay(initialDate)
  );
  const [windowStart, setWindowStart] = useState(() =>
    startOfDay(addDays(initialDate, -2))
  );

  const dates = useMemo(
    () =>
      Array.from({ length: daysToShow }, (_, index) =>
        addDays(windowStart, index)
      ),
    [daysToShow, windowStart]
  );

  const monthLabel = selectedDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const handleSelect = (date: Date) => {
    const normalized = startOfDay(date);
    setSelectedDate(normalized);
    onDateChange?.(normalized);
  };

  return (
    <section className={cn("mb-10", className)}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-400">{monthLabel}</p>
        <div className="flex items-center gap-2"></div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous dates"
          onClick={() => setWindowStart((current) => addDays(current, -7))}
          className="flex size-8 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {dates.map((date) => (
            <CalendarDateButton
              key={date.toISOString()}
              date={date}
              isSelected={date.toDateString() === selectedDate.toDateString()}
              onSelect={handleSelect}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Next dates"
          onClick={() => setWindowStart((current) => addDays(current, 7))}
          className="flex size-8 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </section>
  );
};

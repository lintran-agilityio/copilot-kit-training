import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { addDays, startOfDay, toDateKey, cn } from "@repo/utils";
import { CalendarDateButton } from "@/components/calendar";

type DateStripProps = {
  label: string;
  selectedDate: Date | null;
  minDate?: Date;
  disabled?: boolean;
  onSelect: (date: Date) => void;
};

const windowStartFor = (anchor: Date) => startOfDay(addDays(anchor, -2));

export const DateSelected = ({
  label,
  selectedDate,
  minDate,
  disabled = false,
  onSelect,
}: DateStripProps) => {
  const today = startOfDay(new Date());
  const initialWindow = selectedDate ?? minDate ?? today;

  const [windowStart, setWindowStart] = useState(() =>
    windowStartFor(initialWindow),
  );

  // When the parent sets/changes the selected date (e.g. modify modal prefills
  // a booking), keep that date visible in the 7-day strip.
  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    const selected = startOfDay(selectedDate);
    const windowEnd = addDays(windowStart, 6);

    if (selected < windowStart || selected > windowEnd) {
      setWindowStart(windowStartFor(selected));
    }
  }, [selectedDate, windowStart]);

  const dates = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(windowStart, index)),
    [windowStart],
  );

  const monthLabel = (selectedDate ?? windowStart).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">
          {label}
        </p>
        <p className="text-xs text-zinc-500">{monthLabel}</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Previous ${label.toLowerCase()} dates`}
          disabled={disabled}
          onClick={() => setWindowStart((current) => addDays(current, -7))}
          className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-white/20 hover:text-white disabled:pointer-events-none disabled:opacity-30 [&_svg]:pointer-events-none"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="app-scrollbar flex flex-1 gap-2 overflow-x-auto pb-1">
          {dates.map((date) => {
            const isDisabled =
              disabled || (minDate ? date < minDate : date < today);
            const isSelected =
              selectedDate != null &&
              toDateKey(selectedDate) === toDateKey(date);

            return (
              <CalendarDateButton
                key={toDateKey(date)}
                date={date}
                isSelected={isSelected}
                onSelect={(nextDate) => {
                  if (!isDisabled) {
                    onSelect(nextDate);
                  }
                }}
                className={cn(isDisabled && "pointer-events-none opacity-30")}
              />
            );
          })}
        </div>

        <button
          type="button"
          aria-label={`Next ${label.toLowerCase()} dates`}
          disabled={disabled}
          onClick={() => setWindowStart((current) => addDays(current, 7))}
          className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-white/20 hover:text-white disabled:pointer-events-none disabled:opacity-30 [&_svg]:pointer-events-none"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
};

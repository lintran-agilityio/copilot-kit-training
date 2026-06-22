"use client";

import { cn } from "@/utils";

type CalendarDateButtonProps = {
  date: Date;
  isSelected: boolean;
  onSelect: (date: Date) => void;
};

export const CalendarDateButton = ({
  date,
  isSelected,
  onSelect,
}: CalendarDateButtonProps) => {
  const weekday = date
    .toLocaleDateString("en-US", { weekday: "short" })
    .toUpperCase();

  return (
    <button
      type="button"
      onClick={() => onSelect(date)}
      className={cn(
        "flex min-w-[52px] flex-col items-center rounded-xl px-1.5 py-1.5 transition-colors",
        isSelected
          ? "bg-[#E6C547] text-black"
          : "text-zinc-400 hover:bg-white/5 hover:text-white"
      )}
    >
      <span className="text-[11px] font-medium tracking-[0.12em]">
        {weekday}
      </span>
      <span className="mt-1 text-sm font-medium">{date.getDate()}</span>
    </button>
  );
};

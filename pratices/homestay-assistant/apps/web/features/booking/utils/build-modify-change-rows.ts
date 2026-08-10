import type { ModifyStaySnapshot } from "@/features/booking/types/booking";
import {
  countNightOfDates,
  formatPrice,
  formatShortDateForDisplay,
} from "@repo/utils";

export type ModifyChangeRow = {
  label: string;
  from: string;
  to: string;
};

export const buildModifyChangeRows = (
  original: ModifyStaySnapshot,
  next: ModifyStaySnapshot,
  pricePerNight: number,
): ModifyChangeRow[] => {
  const rows: ModifyChangeRow[] = [];

  if (original.guests !== next.guests) {
    rows.push({
      label: "Guests",
      from: String(original.guests),
      to: String(next.guests),
    });
  }

  if (original.checkInDate !== next.checkInDate) {
    rows.push({
      label: "Check-in",
      from: formatShortDateForDisplay(original.checkInDate),
      to: formatShortDateForDisplay(next.checkInDate),
    });
  }

  if (original.checkOutDate !== next.checkOutDate) {
    rows.push({
      label: "Check-out",
      from: formatShortDateForDisplay(original.checkOutDate),
      to: formatShortDateForDisplay(next.checkOutDate),
    });
  }

  const originalTotal =
    countNightOfDates(original.checkInDate, original.checkOutDate) *
    pricePerNight;
  const nextTotal =
    countNightOfDates(next.checkInDate, next.checkOutDate) * pricePerNight;

  if (originalTotal !== nextTotal) {
    rows.push({
      label: "Total",
      from: formatPrice(originalTotal) ?? String(originalTotal),
      to: formatPrice(nextTotal) ?? String(nextTotal),
    });
  }

  return rows;
};

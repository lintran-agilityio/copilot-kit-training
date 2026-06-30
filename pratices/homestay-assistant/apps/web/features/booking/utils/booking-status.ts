import { BookingStatus } from "@repo/types";

export type BookingStatusMeta = {
  label: string;
  className: string;
};

const normalizeStatus = (status: string) => status.toUpperCase();

export const getBookingStatusMeta = (status: string): BookingStatusMeta => {
  switch (normalizeStatus(status)) {
    case BookingStatus.CONFIRMED.toUpperCase():
      return {
        label: "Confirmed",
        className:
          "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
      };
    case BookingStatus.PENDING.toUpperCase():
      return {
        label: "Pending",
        className: "border-amber-500/30 bg-amber-500/15 text-amber-300",
      };
    case BookingStatus.CANCELLED.toUpperCase():
      return {
        label: "Cancelled",
        className: "border-zinc-500/30 bg-zinc-500/15 text-zinc-400",
      };
    default:
      return {
        label: status,
        className: "border-zinc-500/30 bg-zinc-500/15 text-zinc-400",
      };
  }
};

export const formatBookingDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

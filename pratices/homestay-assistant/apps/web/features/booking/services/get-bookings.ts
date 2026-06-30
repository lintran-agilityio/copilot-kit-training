import { getBaseUrl } from "@/utils";
import type { BookingResponse } from "../types/booking";
import { PREFIX_URL } from "@/types";

type GetMyBookingsProps = {
  via?: PREFIX_URL;
  userId?: string;
};

export const getMyBookings = async ({
  via = PREFIX_URL.BACKEND,
  userId,
}: GetMyBookingsProps = {}): Promise<BookingResponse[]> => {
  const path =
    via === PREFIX_URL.WEB
      ? "/bookings"
      : `/bookings?userId=${encodeURIComponent(userId ?? "")}`;
  const baseUrl = getBaseUrl(via);

  const response = await fetch(`${baseUrl}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch bookings");
  }

  return (await response.json()) as BookingResponse[];
};

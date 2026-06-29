import { getApiUrl } from "@/utils";
import type { BookingResponse } from "../types/booking";

type GetMyBookingsProps = {
  configUrl?: string;
  userId?: string;
};

export const getMyBookings = async ({
  configUrl = getApiUrl(),
  userId,
}: GetMyBookingsProps = {}): Promise<BookingResponse[]> => {
  const path =
    configUrl === "/api"
      ? "/bookings"
      : `/bookings?userId=${encodeURIComponent(userId ?? "")}`;

  const response = await fetch(`${configUrl}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch bookings");
  }

  return (await response.json()) as BookingResponse[];
};

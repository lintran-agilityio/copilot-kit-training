import { getApiUrl } from "@/utils";
import type { BookingResponse } from "../types/booking";

export const getMyBookings = async (
  userId: string,
): Promise<BookingResponse[]> => {
  const response = await fetch(
    `${getApiUrl()}/bookings?userId=${encodeURIComponent(userId)}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch bookings");
  }

  return (await response.json()) as BookingResponse[];
};

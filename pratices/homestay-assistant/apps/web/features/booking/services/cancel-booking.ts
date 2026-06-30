import { ROUTES } from "@repo/constants";
import type { BookingItem } from "../types/booking";

export const cancelBooking = async (
  bookingId: string,
): Promise<BookingItem> => {
  const response = await fetch(
    `/api${ROUTES.BOOKINGS}/${encodeURIComponent(bookingId)}`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    let message = "Failed to cancel booking";

    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) {
        message = body.error;
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to cancel booking");
    }

    throw new Error(message);
  }

  return (await response.json()) as BookingItem;
};

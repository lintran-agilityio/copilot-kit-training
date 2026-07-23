import { ROUTES } from "@repo/constants";
import { PREFIX_URL } from "@repo/types";
import { sanitizeBookingId } from "@repo/utils";

import type { BookingResponse } from "@/features/booking/types/booking";
import { getBaseUrl } from "@/utils";

type CancelBookingProps = {
  bookingId: string;
  via?: PREFIX_URL;
};

export const cancelBookingById = async ({
  bookingId,
  via = PREFIX_URL.WEB,
}: CancelBookingProps): Promise<BookingResponse> => {
  const id = sanitizeBookingId(bookingId);

  if (!id) {
    throw new Error("Booking ID is required.");
  }

  const baseUrl = getBaseUrl(via);
  const response = await fetch(
    `${baseUrl}${ROUTES.BOOKINGS}/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
      error?: string;
    } | null;

    const message =
      (typeof body?.message === "string" && body.message) ||
      (Array.isArray(body?.message) && body.message.join(", ")) ||
      body?.error ||
      "Failed to cancel booking";

    throw new Error(message);
  }

  return (await response.json()) as BookingResponse;
};

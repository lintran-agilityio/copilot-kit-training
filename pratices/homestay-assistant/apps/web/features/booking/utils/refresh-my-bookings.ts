import { getMyBookings } from "@/features/booking/services";
import { useBookingsStore } from "@/features/booking/stores/bookings-store";
import { PREFIX_URL } from "@/types";

export const refreshMyBookings = async (via: PREFIX_URL = PREFIX_URL.WEB) => {
  const bookings = await getMyBookings({ via });
  useBookingsStore.getState().setBookings(bookings);

  return bookings;
};

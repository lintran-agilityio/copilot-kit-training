import { BookingStatus } from "@/features/booking/types/booking";

export const isBookingCancellable = (status: string, checkOutDate: string) => {
  if (status.toLowerCase() === BookingStatus.CANCELLED) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkout = new Date(`${checkOutDate}T00:00:00`);
  return checkout >= today;
};

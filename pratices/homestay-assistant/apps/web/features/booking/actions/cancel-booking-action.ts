import { cancelBooking } from "@/features/booking/services";

export const cancelBookingAction = async (bookingId: string) =>
  cancelBooking(bookingId);

import type { Room } from "@/features/room/types/room";

export const stripRoomBookingOverlay = (room: Room): Room => {
  const roomWithoutBookingOverlay = { ...room };
  delete roomWithoutBookingOverlay.bookingStatus;
  delete roomWithoutBookingOverlay.checkInDate;
  delete roomWithoutBookingOverlay.checkOutDate;
  delete roomWithoutBookingOverlay.available;

  return roomWithoutBookingOverlay;
};

import type { Room } from "@/features/room/types/room";

export const stripRoomBookingOverlay = (room: Room): Room => {
  const {
    bookingStatus: _bookingStatus,
    checkInDate: _checkInDate,
    checkOutDate: _checkOutDate,
    available: _available,
    ...roomWithoutBookingOverlay
  } = room;

  return roomWithoutBookingOverlay;
};

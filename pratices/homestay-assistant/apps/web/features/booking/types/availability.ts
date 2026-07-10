import type { Room } from "@/features/room/types/room";

export type CheckRoomAvailabilityInput = {
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  guests?: number;
};

export type CheckRoomAvailabilityResult = {
  available: boolean;
  guestsWithinCapacity: boolean;
  room: Room;
  checkInDate: string;
  checkOutDate: string;
  guests?: number;
};

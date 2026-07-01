export type CheckRoomAvailabilityInput = {
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
};

export type CheckRoomAvailabilityResult = {
  available: boolean;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
};

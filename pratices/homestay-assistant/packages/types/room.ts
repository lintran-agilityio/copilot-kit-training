import type { BookingStatus } from "./booking";

export type RoomDetail = {
  id: string;
  name: string;
  level: number;
  levelColor: string;
  capacity: number;
  description: string;
  imageUrl: string;
  availableSlots: number;
  pricePerNight: number;
  amenities: string[];
  bookingStatus?: BookingStatus;
  checkInDate?: string;
  checkOutDate?: string;
  available?: boolean;
};

/** Rooms matching a name lookup (API → Mastra → CopilotKit). */
export type RoomByNameLookup = {
  rooms: RoomDetail[];
  queryName: string;
};

/** Rooms matching find_room search/filter criteria (API → Mastra → CopilotKit). */
export type FindRoomResult = {
  rooms: RoomDetail[];
  name?: string;
  date?: string;
  guests?: number;
  level?: number;
};

import type { BookingStatus } from "@repo/types";

export type Amenity =
  | "monitor"
  | "coffee"
  | "mic"
  | "wifi"
  | "video"
  | "whiteboard"
  | "phone";

export type Room = {
  id: string;
  name: string;
  level: number;
  levelColor: string;
  capacity: number;
  description: string;
  imageUrl: string;
  imageUrls?: string[];
  availableSlots: number;
  pricePerNight?: number;
  amenities: Amenity[];
  bookingStatus?: BookingStatus;
  checkInDate?: string;
  checkOutDate?: string;
  available?: boolean;
};

export enum RoomLoadMode {
  ALL = "all",
  AVAILABLE = "available",
};

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
  availableSlots: number;
  amenities: Amenity[];
};

export enum RoomLoadMode {
  ALL = "all",
  AVAILABLE = "available",
};

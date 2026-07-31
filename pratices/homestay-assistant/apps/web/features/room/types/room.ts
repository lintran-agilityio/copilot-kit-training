import type { BookingStatus } from "@repo/types";
import type { ToolRendererProps } from "@/features/copilot/types";

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

export type FindRoomResult = {
  rooms?: Room[];
  name?: string;
  date?: string;
  guests?: number;
  level?: number;
};

export type FindRoomToolProps = ToolRendererProps<FindRoomResult>;

export type GetRoomByIdResult = {
  room?: Room | null;
};

export type GetRoomByIdToolProps = ToolRendererProps<GetRoomByIdResult>;
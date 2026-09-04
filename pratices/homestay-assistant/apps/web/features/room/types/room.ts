import type { BookingStatus } from "@repo/types";
import type { FindRoomPurpose } from "@repo/constants";
import type { ToolRendererProps } from "@/features/chatbot/declarative-ui/types";

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
  /** Booking Form prefill hint — guest count stated directly in the BOOK message. */
  guests?: number;
  available?: boolean;
};

export type FindRoomResult = {
  rooms?: Room[];
  name?: string;
  date?: string;
  guests?: number;
  level?: number;
  /** Echoed from find_room args — skip Room List when book_resolve + exactly 1 room, or always for resolve. */
  purpose?: FindRoomPurpose;
};

export type FindRoomToolProps = ToolRendererProps<FindRoomResult> & {
  /** Streaming tool args — used to skip Room List skeleton on book_resolve/resolve. */
  parameters?: {
    purpose?: FindRoomResult["purpose"];
  };
};

export type GetRoomByIdResult = {
  room?: Room | null;
};

export type GetRoomByIdToolProps = ToolRendererProps<GetRoomByIdResult>;
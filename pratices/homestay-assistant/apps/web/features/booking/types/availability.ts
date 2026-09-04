import { ToolRendererProps } from "@/features/chatbot/declarative-ui/types";
import { MODEL_NAME } from "@repo/types";

export type CheckRoomAvailabilityInput = {
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  guests?: number;
  /** Agent-tool only; not sent to the HTTP availability API. */
  flow?: MODEL_NAME.CREATE | MODEL_NAME.MODIFY;
  excludeBookingId?: string;
};

export type CheckRoomAvailabilityResult = {
  available?: boolean;
  guestsWithinCapacity?: boolean;
  nextAction?: "confirm_booking" | "confirm_modify_booking" | "stop_booking";
  flow?: MODEL_NAME.CREATE | MODEL_NAME.MODIFY;
  room?: {
    name?: string;
    capacity?: number;
  };
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
  /** Present on modify availability — booking being updated. */
  bookingId?: string;
  originalCheckInDate?: string;
  originalCheckOutDate?: string;
  originalGuests?: number;
};

export type CheckRoomAvailabilityToolProps =
  ToolRendererProps<CheckRoomAvailabilityResult>;

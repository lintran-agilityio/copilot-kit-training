import { ToolRendererProps } from "@/features/copilot/types";

export type CheckRoomAvailabilityInput = {
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  guests?: number;
  /** Agent-tool only; not sent to the HTTP availability API. */
  flow?: "create" | "modify";
  excludeBookingId?: string;
};

export type CheckRoomAvailabilityResult = {
  available?: boolean;
  guestsWithinCapacity?: boolean;
  nextAction?: "confirm_booking" | "CONFIRM_MODIFY_BOOKING" | "stop_booking";
  flow?: "create" | "modify";
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

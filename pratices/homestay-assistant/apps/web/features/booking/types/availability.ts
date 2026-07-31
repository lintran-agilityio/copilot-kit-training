import { ToolRendererProps } from "@/features/copilot/types";

export type CheckRoomAvailabilityInput = {
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  guests?: number;
  excludeBookingId?: string;
};

export type CheckRoomAvailabilityResult = {
  available?: boolean;
  guestsWithinCapacity?: boolean;
  room?: {
    name?: string;
    capacity?: number;
  };
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
};

export type CheckRoomAvailabilityToolProps = ToolRendererProps<CheckRoomAvailabilityResult>;


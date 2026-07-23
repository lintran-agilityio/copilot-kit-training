import { ToolRendererProps } from "@/features/copilot/types";

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

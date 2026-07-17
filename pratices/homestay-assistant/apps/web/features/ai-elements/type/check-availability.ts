import { ToolRendererProps } from "./tool-render-props";

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

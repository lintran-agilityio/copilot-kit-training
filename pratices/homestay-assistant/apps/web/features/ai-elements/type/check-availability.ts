import { ToolCallStatus } from "@copilotkit/react-core/v2";

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

export type CheckRoomAvailabilityToolProps = {
  status: ToolCallStatus | "inProgress" | "executing" | "complete";
  result?: CheckRoomAvailabilityResult | string | null;
};

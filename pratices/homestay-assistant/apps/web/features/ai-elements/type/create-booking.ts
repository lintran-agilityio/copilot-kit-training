import { ToolCallStatus } from "@copilotkit/react-core/v2";

export type CreateBookingResult = {
  id?: string;
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
  totalPrice?: number;
  status?: string;
  room?: {
    name?: string;
  };
};

export type CreateBookingToolProps = {
  status: ToolCallStatus | "inProgress" | "executing" | "complete";
  result?: CreateBookingResult | string | null;
};

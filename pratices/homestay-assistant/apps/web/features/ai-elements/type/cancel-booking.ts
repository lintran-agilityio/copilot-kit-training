import { ToolCallStatus } from "@copilotkit/react-core/v2";

export type CancelBookingResult = {
  id?: string;
  room?: {
    name?: string;
  };
  status?: string;
};

export type CancelBookingToolProps = {
  status: ToolCallStatus | "inProgress" | "executing" | "complete";
  result?: CancelBookingResult | string | null;
};

import { ToolRendererProps } from "@/features/copilot/types";

export type CancelBookingResult = {
  id?: string;
  room?: {
    name?: string;
  };
  status?: string;
};

export type CancelBookingToolProps = ToolRendererProps<CancelBookingResult>;

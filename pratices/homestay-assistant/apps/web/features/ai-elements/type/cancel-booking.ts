import { ToolRendererProps } from "./tool-render-props";

export type CancelBookingResult = {
  id?: string;
  room?: {
    name?: string;
  };
  status?: string;
};

export type CancelBookingToolProps = ToolRendererProps<CancelBookingResult>;

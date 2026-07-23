import { ToolRendererProps } from "@/features/copilot/types";

export type UpdateBookingResult = {
  id?: string;
  room?: {
    name?: string;
  };
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
  status?: string;
};

export type UpdateBookingToolProps = ToolRendererProps<UpdateBookingResult>;

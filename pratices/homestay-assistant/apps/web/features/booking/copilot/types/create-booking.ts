import { ToolRendererProps } from "@/features/copilot/types";

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

export type CreateBookingToolProps = ToolRendererProps<CreateBookingResult>;

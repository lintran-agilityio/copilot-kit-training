import { ToolRendererProps } from "./tool-render-props";

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

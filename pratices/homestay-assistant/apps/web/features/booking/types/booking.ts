import type { Room } from "@/features/room/types/room";
import { ToolRendererProps } from "@/features/copilot/types";

export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
}

export interface BookingItem {
  id: string;
  userId: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  totalPrice: number;
  status: BookingStatus;
}

export interface BookingResponse extends BookingItem {
  room?: Room;
}

export interface BookingDraft {
  roomId: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  guests: number;
}

export type BookingDetails = {
  bookingId: string;
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  guests?: number;
  totalPrice?: number;
};

export type CancelBookingResult = {
  id?: string;
  room?: {
    name?: string;
  };
  status?: string;
};

export type CancelBookingToolProps = ToolRendererProps<CancelBookingResult>;

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

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

/** Pre-edit booking stay used to render confirm_modify before → after diffs. */
export type ModifyStaySnapshot = {
  checkInDate: string;
  checkOutDate: string;
  guests: number;
};

/** Candidate stay chosen in edit_modify_booking — authoritative for confirm_modify UI. */
export type PendingModifyStay = ModifyStaySnapshot & {
  bookingId: string;
  /** Original booking values from edit_modify_booking args (before the guest edited). */
  original: ModifyStaySnapshot;
};

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

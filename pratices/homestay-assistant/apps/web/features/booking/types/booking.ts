import type { GetBookingsPurpose } from "@repo/constants";
import type { Room } from "@/features/room/types/room";
import { ToolRendererProps } from "@/features/chatbot/declarative-ui/types";

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

export type CancelBookingParameters = {
  bookingId?: string;
};

export type CancelBookingToolProps = ToolRendererProps<CancelBookingResult> & {
  parameters?: CancelBookingParameters;
};

export type CreateBookingResult = {
  id?: string;
  roomId?: string;
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
  totalPrice?: number;
  status?: string;
  room?: {
    name?: string;
  };
};

export type CreateBookingParameters = {
  roomId?: string;
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
};

export type CreateBookingToolProps = ToolRendererProps<CreateBookingResult> & {
  parameters?: CreateBookingParameters;
};

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

export type UpdateBookingParameters = {
  bookingId?: string;
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
  confirmation?: {
    confirmed: true;
    bookingId: string;
    checkInDate: string;
    checkOutDate: string;
    guests: number;
  };
};

export type UpdateBookingToolProps = ToolRendererProps<UpdateBookingResult> & {
  parameters?: UpdateBookingParameters;
};

export type GetBookingsResult = {
  bookings?: BookingResponse[];
  /**
   * Echoed from get_bookings args. "resolve" means cancel/modify/change-room
   * resolution forced this fetch — not a guest-facing VIEW/LIST call.
   * MyBookingsNotice suppresses itself in this case so only the HITL that
   * follows (confirm dialog or picker) renders.
   */
  purpose?: GetBookingsPurpose;
};

export type GetBookingsParameters = {
  purpose?: GetBookingsResult["purpose"];
};

export type GetBookingsToolProps = ToolRendererProps<GetBookingsResult> & {
  parameters?: GetBookingsParameters;
};

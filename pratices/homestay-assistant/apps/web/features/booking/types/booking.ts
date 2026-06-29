import type { Room } from "@/features/room/types/room";

export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
}

export type BookingSubmitStatus = "idle" | "submitting" | "success" | "error";
export interface BookingItem {
  id: string;
  userId: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  totalPrice: number;
  status: BookingStatus;
};

export interface BookingResponse extends BookingItem {
  room?: Room;
}
export interface SelectedRoom {
  id: string;
  name: string;
  pricePerNight: number;
  capacity: number;
}

export interface BookingDraft {
  selectedRoom: SelectedRoom | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  guests: number;
  totalPrice: number;
}

export type UpdateBookingFormInput = {
  room: {
    id: string;
    name: string;
    pricePerNight: number;
    capacity: number;
  };
  checkInDate: string;
  checkOutDate: string;
  guests: number;
};

export type BookingDetails = {
  bookingId: string;
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  guests?: number;
  totalPrice?: number;
};

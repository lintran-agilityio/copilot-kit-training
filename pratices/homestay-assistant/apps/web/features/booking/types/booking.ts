import type { Room } from "@/features/room/types/room";

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

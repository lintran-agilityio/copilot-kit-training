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

export interface CreatedBooking {
  id: string;
  roomId: string;
  userId: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  totalPrice: number;
  status: string;
}

export type BookingSubmitStatus = "idle" | "submitting" | "success" | "error";

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

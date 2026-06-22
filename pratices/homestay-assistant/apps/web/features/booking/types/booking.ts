export interface SelectedRoom {
  id: string;
  name: string;
  pricePerNight: number;
  capacity: number;
};

export interface BookingDraft {
  selectedRoom: SelectedRoom | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  guests: number;
  totalPrice: number;
};

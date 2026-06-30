export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

/** Booking summary passed from Mastra lookup → CopilotKit HITL cancel dialog. */
export type CancellationBookingSummary = {
  bookingId: string;
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  totalPrice: number;
};

export type FindBookingByRoomResult =
  | { status: 'found'; booking: CancellationBookingSummary }
  | { status: 'not_found'; message: string }
  | {
      status: 'ambiguous';
      bookings: CancellationBookingSummary[];
      message: string;
    };

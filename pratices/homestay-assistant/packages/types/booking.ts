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

/** Active booking lookup by ID (Mastra → CopilotKit cancel flow). */
export type BookingCancelLookup = {
  bookings: CancellationBookingSummary[];
  bookingId: string;
  queryName: string;
};

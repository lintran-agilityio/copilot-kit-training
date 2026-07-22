export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

/** Booking summary passed from Mastra lookup → CopilotKit HITL cancel/modify flows. */
export type CancellationBookingSummary = {
  bookingId: string;
  roomId: string;
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  totalPrice: number;
};

/** Active booking lookup by ID (Mastra → CopilotKit cancel/modify flows). */
export type BookingCancelLookup = {
  bookings: CancellationBookingSummary[];
  bookingId: string;
  queryName: string;
  /** Full room for modify edit form — present when booking is found. */
  room?: {
    id: string;
    name: string;
    level: number;
    levelColor: string;
    capacity: number;
    description: string;
    imageUrl: string;
    availableSlots: number;
    amenities: string[];
    pricePerNight: number;
  };
};

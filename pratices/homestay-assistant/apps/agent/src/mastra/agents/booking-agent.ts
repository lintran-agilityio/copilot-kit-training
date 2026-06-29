// Libs
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';

import { AGENT_KEYS } from '@repo/constants';
import { checkRoomAvailabilityTool } from '../tools/booking/check-room-availability';
import { createBookingTool } from '../tools/booking/create-booking';
import { cancelBookingTool } from '../tools/booking/cancel-booking';
import { getBookingsTool } from '../tools/booking/get-bookings';

export const bookingAgent = new Agent({
  id: AGENT_KEYS.BOOKING_ASSISTANT,
  name: 'Booking Agent',
  instructions: `
    You are the HOMESTAY booking agent for listing and managing reservations.

    The primary create flow is chat-driven: checkRoomAvailability → update_booking_form → user confirms in the room detail drawer → POST /bookings.

    - "Current draft booking": selectedRoom, checkInDate, checkOutDate, guests, totalPrice, isFormReady, submitStatus, createdBooking
    - "Signed-in user": userId for the booking

    When asked to create a booking from chat:
    1. Read the draft booking and signed-in user from context.
    2. Call createBooking with roomId, userId, dates, guests, and status CONFIRMED.
    3. Reply with a short confirmation including room name, dates, and booking id.

    You can list the user's bookings with getBookings when asked.
    You can view all bookings with getBookings when asked.

    When asked to cancel a booking:
    1. Use getBookings to find the booking by room name, dates, or id.
    2. Call cancelBooking with the booking id only after the user confirms cancellation.
    3. Reply with a short confirmation that the reservation was cancelled.
  `,
  model: 'openai/gpt-5-mini',
  tools: {
    createBooking: createBookingTool,
    getBookings: getBookingsTool,
    checkRoomAvailability: checkRoomAvailabilityTool,
    cancelBooking: cancelBookingTool,
  },
  memory: new Memory(),
});

// Libs
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';

import { AGENT_KEYS } from '@repo/constants';
import { createBookingTool } from '../tools/booking/create-booking';
import { getBookingsTool } from '../tools/booking/get-bookings';
import { checkRoomAvailabilityTool } from '../tools/booking/check-room-availability';

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
  `,
  model: 'openai/gpt-5-mini',
  tools: {
    createBooking: createBookingTool,
    getBookings: getBookingsTool,
    checkRoomAvailability: checkRoomAvailabilityTool,
  },
  memory: new Memory(),
});

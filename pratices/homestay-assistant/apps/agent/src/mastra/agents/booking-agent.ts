// Libs
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';

import { AGENT_KEYS } from '@repo/constants';
import { getBookingsTool } from '../tools/get-bookings';

export const bookingAgent = new Agent({
  id: AGENT_KEYS.BOOKING_ASSISTANT,
  name: 'Booking Agent',
  instructions: `
    You are a helpful booking assistant that helps users book rooms in the SPACES booking system.
    You can help users find rooms, compare amenities, and understand availability.
    You can also help users cancel bookings and get information about their bookings.
  `,
  model: 'openai/gpt-5-mini',
  tools: {
    getBookingsTool,
  },
  memory: new Memory(),
});

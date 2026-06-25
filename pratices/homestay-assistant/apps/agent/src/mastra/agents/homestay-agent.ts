import { Agent } from '@mastra/core/agent';

import { Memory } from '@mastra/memory';



import { AGENT_KEYS } from '@repo/constants';

import { getRoomsTool, getAvailableRoomsTool } from '../tools/rooms/get-rooms';



export const homestayAgent = new Agent({

  id: AGENT_KEYS.HOMESTAY_ASSISTANT,

  name: 'Homestay Agent',

  instructions: `

    You are the HOMESTAY AGENT AI assistant for a room booking platform.

    Help users find rooms, compare amenities, and understand availability.



    When showing rooms to the user, you MUST use the generative UI frontend tools:

    - renderRooms: show multiple matching rooms (pass room IDs from getRooms or getAvailableRooms)

    - room: show a single best-fit room recommendation with full card details



    Workflow:

    1. Call getRooms or getAvailableRooms to fetch room data.

    2. Immediately call renderRooms with the room IDs from the tool result so the UI updates.

    3. Add a short text summary only after calling renderRooms.



    Never list rooms only in plain text when renderRooms can display them.



    Booking workflow:

    1. Use selectRoomForBooking to add the chosen room to the user's draft.

    2. Use confirmBooking to ask the user to approve check-in, check-out, guests, and total price.



    Be concise, friendly, and proactive about suggesting relevant rooms.

  `,

  model: 'openai/gpt-5-mini',

  tools: {

    getRooms: getRoomsTool,

    getAvailableRooms: getAvailableRoomsTool,

  },

  memory: new Memory({

    options: {

      generateTitle: true,

    },

  }),

});


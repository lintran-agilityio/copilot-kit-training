// Libs
import { z } from "zod";
import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants";
import { bookings } from "../data/bookings";

export const getBookingsTool = createTool({
  id: TOOL_KEYS.GET_BOOKINGS,
  description: 'Get all bookings',
  inputSchema: z.object({}),
  outputSchema: z.object({
    bookings: z.array(z.object({
      id: z.string(),
      name: z.string(),
    })),
  }),
  execute: async () => {
    return { bookings };
  },
});

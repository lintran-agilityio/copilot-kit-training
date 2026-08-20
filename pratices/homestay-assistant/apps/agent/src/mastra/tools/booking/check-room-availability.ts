// Libs
import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { checkRoomAvailabilityOutputSchema } from "@/mastra/schemas/booking";
import { throwIfAborted } from "@/mastra/utils";
import { checkRoomAvailabilityInputSchema } from "@repo/schemas";

import {
  buildAvailabilityResult,
  evaluateAvailabilityCandidate,
  resolveAvailabilityCandidate,
  validateAvailabilityCandidate,
} from "@/mastra/utils";

export const checkRoomAvailabilityTool = createTool({
  id: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
  description: `
    Check whether a room is available for the requested dates and guest count.
    For booking modifications, exclude the specified existing booking from the availability check.
    Returns availability, guest-capacity information, the booking flow, and the next action.
  `,
  inputSchema: checkRoomAvailabilityInputSchema,
  outputSchema: checkRoomAvailabilityOutputSchema,
  execute: async (input, context) => {
    throwIfAborted(context.abortSignal);

    const candidate = resolveAvailabilityCandidate(
      input,
      context.requestContext,
    );

    validateAvailabilityCandidate(candidate);

    const evaluation = await evaluateAvailabilityCandidate(candidate, context);

    return buildAvailabilityResult(candidate, evaluation);
  },
});

// Libs
import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import {
  checkRoomAvailabilityOutputSchema,
  type CheckRoomAvailabilityOutput,
} from "@/mastra/schemas/booking";
import { throwIfAborted } from "@/mastra/utils";
import { checkRoomAvailabilityInputSchema } from "@repo/schemas";

import {
  buildAvailabilityResult,
  evaluateAvailabilityCandidate,
  resolveAvailabilityCandidate,
  validateAvailabilityCandidate,
} from "@/mastra/utils";

export const toCheckRoomAvailabilityModelOutput = (
  output: CheckRoomAvailabilityOutput,
) => {
  const rendersUnavailableCard =
    output.available === false || output.guestsWithinCapacity === false;

  return {
    type: "json" as const,
    value: rendersUnavailableCard
      ? {
          available: output.available,
          guestsWithinCapacity: output.guestsWithinCapacity,
          nextAction: output.nextAction,
          flow: output.flow,
          replyHint:
            'BookingUnavailable Generic UI is already rendered. Reply with exactly ONE very short sentence in the guest\'s language offering help with another option. Do NOT repeat the room, reason, capacity, dates, guests, availability values, or any other card detail. English example: "I can help you choose another option."',
        }
      : output,
  };
};

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
  toModelOutput: toCheckRoomAvailabilityModelOutput,
});

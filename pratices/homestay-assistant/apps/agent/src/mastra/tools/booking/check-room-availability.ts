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
    MODIFY flow only. Check whether a room is available for changed dates / guest count on an
    EXISTING booking — always pass flow=modify and excludeBookingId so that booking is excluded
    from the overlap check. A NEW booking never uses this tool: its availability is checked inside
    find_room(book_resolve) and again by create_booking server-side.
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

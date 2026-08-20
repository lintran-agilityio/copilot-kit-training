// Libs
import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { createBookingInputSchema } from "@repo/schemas";
import { bookingMutationOutputSchema } from "@/mastra/schemas/booking";
import { createBooking } from "@/mastra/services";
import {
  resolveCreateBookingInput,
  buildCreateBookingCommand,
} from "@/mastra/utils/booking";
import {
  commitIfNotAborted,
  runBookingMutation,
  serviceContextFromTool,
  throwIfAborted,
} from "@/mastra/utils/abort";

export const createBookingTool = createTool({
  id: TOOL_KEYS.BOOKING.CREATE_BOOKING,
  description: `
    Create a confirmed booking for a room and stay.
    The booking is created for the signed-in user.
  `,
  inputSchema: createBookingInputSchema,
  outputSchema: bookingMutationOutputSchema,
  execute: async (input, context) => {
    throwIfAborted(context.abortSignal);

    const resolvedInput = resolveCreateBookingInput(
      input,
      context.requestContext,
    );

    const command = buildCreateBookingCommand(resolvedInput);

    return runBookingMutation(() =>
      commitIfNotAborted(context.abortSignal, () =>
        createBooking(
          command,
          serviceContextFromTool(context),
        ),
      ),
    );
  },
});
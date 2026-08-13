import type {
  ProcessInputStepArgs,
  ProcessInputStepResult,
} from "@mastra/core/processors";

import { narrationOnlyStep } from "@/mastra/booking/narration-only-step";

/** Pin the model to a single no-op modify chat reply — no offers, no more tools. */
export const MODIFY_NOOP_NARRATION_INSTRUCTION =
  "MODIFY no-op: the stated check-in / check-out / guests already match the resolved booking. " +
  "Reply with ONE short sentence only that the booking already has those details (or that no change is needed). " +
  "Do NOT suggest other changes, offer alternatives, ask what else to modify, open any form/HITL, or call any tools. STOP.";

/**
 * Terminal prepareStep for stated-modify / availability when the stay is unchanged.
 * Forces text-only and injects a system pin so the model cannot suggest then continue.
 */
export const modifyNoOpNarrationStep = (
  args: Pick<ProcessInputStepArgs, "systemMessages">,
): ProcessInputStepResult => ({
  ...narrationOnlyStep(),
  systemMessages: [
    ...(args.systemMessages ?? []),
    {
      role: "system",
      content: MODIFY_NOOP_NARRATION_INSTRUCTION,
    },
  ],
});

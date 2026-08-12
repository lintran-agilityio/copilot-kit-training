import type { ProcessInputStepResult } from "@mastra/core/processors";

/**
 * prepareStep decision kinds for LIST / CANCEL / MODIFY fast paths.
 * force → pin + call a server tool; narrate → toolChoice none; none → no override.
 */
export const BOOKING_STEP_DECISION_KIND = {
  FORCE: "force",
  NARRATE: "narrate",
  NONE: "none",
} as const;

export type BookingStepDecisionKind =
  (typeof BOOKING_STEP_DECISION_KIND)[keyof typeof BOOKING_STEP_DECISION_KIND];

/**
 * Tool-chain transition after a completed booking tool result.
 * call → force next tool; stop → lock tools for this hop.
 */
export const BOOKING_STEP_TRANSITION_TYPE = {
  CALL: "call",
  STOP: "stop",
} as const;

export type BookingStepTransitionType =
  (typeof BOOKING_STEP_TRANSITION_TYPE)[keyof typeof BOOKING_STEP_TRANSITION_TYPE];

/**
 * Shared prepareStep outcome for VIEW / CANCEL-resolve / MODIFY-resolve fast paths.
 */
export type BookingPrepareStepDecision =
  | {
      kind: typeof BOOKING_STEP_DECISION_KIND.FORCE;
      step: ProcessInputStepResult;
    }
  | {
      kind: typeof BOOKING_STEP_DECISION_KIND.NARRATE;
      step: ProcessInputStepResult;
    }
  | { kind: typeof BOOKING_STEP_DECISION_KIND.NONE };

export type ActionableBookingPrepareStepDecision = Extract<
  BookingPrepareStepDecision,
  {
    kind:
      | typeof BOOKING_STEP_DECISION_KIND.FORCE
      | typeof BOOKING_STEP_DECISION_KIND.NARRATE;
  }
>;

/**
 * True when the decision carries a step override that `enforceBookingStep` should return.
 */
export const isActionableBookingStepDecision = (
  decision: BookingPrepareStepDecision,
): decision is ActionableBookingPrepareStepDecision =>
  decision.kind === BOOKING_STEP_DECISION_KIND.FORCE ||
  decision.kind === BOOKING_STEP_DECISION_KIND.NARRATE;

import {
  AGENT_STEP_LIMIT_PROCESSOR_ID,
  AGENT_STEP_LIMIT_TRIPWIRE_REASON_PREFIX,
  PROMPT_INJECTION_TRIPWIRE_REASON_PREFIX,
  TOKEN_LIMITER_TRIPWIRE_REASON_PREFIX,
  TRIPWIRE_KIND,
  USER_MESSAGE_TOKEN_LIMIT_REASON_PREFIX,
  type TripwireKind,
} from "@repo/constants";

export type TripwirePayloadLike = {
  reason?: string;
  processorId?: string;
};

/**
 * Classify a Mastra tripwire for AG-UI handling.
 *
 * Do not rely on leaf processor ids for input processors — Mastra wraps them as
 * `${agentId}-input-processor`. Reason prefixes and the step-limit processor id
 * are the stable signals.
 */
export const classifyTripwire = (
  payload?: TripwirePayloadLike | null,
): TripwireKind => {
  if (payload?.processorId === AGENT_STEP_LIMIT_PROCESSOR_ID) {
    return TRIPWIRE_KIND.STEP_LIMIT;
  }

  const reason = typeof payload?.reason === "string" ? payload.reason : "";

  if (reason.startsWith(PROMPT_INJECTION_TRIPWIRE_REASON_PREFIX)) {
    return TRIPWIRE_KIND.SECURITY;
  }

  if (
    reason.startsWith(TOKEN_LIMITER_TRIPWIRE_REASON_PREFIX) ||
    reason.startsWith(USER_MESSAGE_TOKEN_LIMIT_REASON_PREFIX)
  ) {
    return TRIPWIRE_KIND.TOKEN_LIMIT;
  }

  if (reason.startsWith(AGENT_STEP_LIMIT_TRIPWIRE_REASON_PREFIX)) {
    return TRIPWIRE_KIND.STEP_LIMIT;
  }

  return TRIPWIRE_KIND.OTHER;
};

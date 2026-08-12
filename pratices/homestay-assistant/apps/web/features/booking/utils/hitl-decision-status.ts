import { ToolCallStatus } from "@copilotkit/react-core/v2";
import { parseToolResult } from "@repo/utils";

import {
  isHitlToolAwaitingUser,
  isHitlToolFinished,
} from "@/features/booking/utils/hitl-tool-status";
import type { HitlToolResult } from "@/features/booking/types/hitl-result";

export const HITL_DECISION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXPIRED: "expired",
} as const;

export type HitlDecisionStatus =
  (typeof HITL_DECISION_STATUS)[keyof typeof HITL_DECISION_STATUS];

type HitlConfirmPayload = {
  confirmed?: boolean;
};

/**
 * Maps CopilotKit HITL lifecycle + respond() payload to a durable UI status.
 * - pending: still awaiting user action (executing)
 * - approved / rejected: from respond({ confirmed })
 * - expired: completed without a usable confirmed flag (abort / missing result)
 */
export const resolveHitlDecisionStatus = (
  status: ToolCallStatus,
  result?: HitlToolResult<HitlConfirmPayload>,
): HitlDecisionStatus => {
  if (!isHitlToolFinished(status)) {
    return HITL_DECISION_STATUS.PENDING;
  }

  const parsed = parseToolResult<HitlConfirmPayload>(result);
  const { confirmed } = parsed || {};
  if (confirmed) {
    return HITL_DECISION_STATUS.APPROVED;
  }

  if (!confirmed) {
    return HITL_DECISION_STATUS.REJECTED;
  }

  return HITL_DECISION_STATUS.EXPIRED;
};

export const isHitlDecisionTerminal = (decision: HitlDecisionStatus) =>
  decision !== HITL_DECISION_STATUS.PENDING;

/** Render HITL while awaiting user action, or after completion (keep history). */
export const shouldRenderHitlCard = (
  status: ToolCallStatus,
  hasRequiredArgs: boolean,
) =>
  hasRequiredArgs &&
  (isHitlToolAwaitingUser(status) || isHitlToolFinished(status));

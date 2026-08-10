import {
  BOOKING_MUTATION_PHASE,
  HITL_CARD_PHASE,
  type BookingMutationPhase,
  type HitlCardPhase,
} from "@/features/booking/constants";
import {
  HITL_DECISION_STATUS,
  type HitlDecisionStatus,
} from "@/features/booking/utils/hitl-decision-status";

type MutationOutcome = {
  phase: BookingMutationPhase;
} | null;

type ResolveHitlCardPhaseInput = {
  status: HitlDecisionStatus;
  isHitlSubmitting: boolean;
  outcome: MutationOutcome;
};

const resolveApprovedCardPhase = (
  outcome: MutationOutcome,
): HitlCardPhase => {
  const { phase } = outcome ?? {};

  switch (phase) {
    case BOOKING_MUTATION_PHASE.SUCCESS:
      return HITL_CARD_PHASE.SUCCESS;
    case BOOKING_MUTATION_PHASE.FAILED:
      return HITL_CARD_PHASE.FAILED;
    default:
      return HITL_CARD_PHASE.SUBMITTING;
  }
};

/**
 * Maps HITL decision + mutation outcome into the shared HITL card phase model.
 * Approved without an outcome yet → submitting (do not show settled copy early).
 */
export const resolveHitlCardPhase = ({
  status,
  isHitlSubmitting,
  outcome,
}: ResolveHitlCardPhaseInput): HitlCardPhase => {
  switch (status) {
    case HITL_DECISION_STATUS.REJECTED:
      return HITL_CARD_PHASE.CANCELLED;
    case HITL_DECISION_STATUS.EXPIRED:
      return HITL_CARD_PHASE.EXPIRED;
    case HITL_DECISION_STATUS.PENDING:
      return isHitlSubmitting
        ? HITL_CARD_PHASE.SUBMITTING
        : HITL_CARD_PHASE.REVIEW;
    case HITL_DECISION_STATUS.APPROVED:
      return resolveApprovedCardPhase(outcome);
  }
};

import { ConversationItem } from "@/features/chat/components";
import {
  HITL_DECISION_STATUS,
  isHitlDecisionTerminal,
  type HitlDecisionStatus,
} from "@/features/booking/utils/hitl-decision-status";

type HitlDecisionUserMessageProps = {
  decisionStatus: HitlDecisionStatus;
  confirmLabel: string;
  cancelLabel: string;
};

/**
 * Visible user-turn label after HITL decide — fills the history gap before the result card.
 */
export const HitlDecisionUserMessage = ({
  decisionStatus,
  confirmLabel,
  cancelLabel,
}: HitlDecisionUserMessageProps) => {
  if (!isHitlDecisionTerminal(decisionStatus)) {
    return null;
  }

  if (
    decisionStatus !== HITL_DECISION_STATUS.APPROVED &&
    decisionStatus !== HITL_DECISION_STATUS.REJECTED
  ) {
    return null;
  }

  const label =
    decisionStatus === HITL_DECISION_STATUS.APPROVED
      ? confirmLabel
      : cancelLabel;

  return (
    <div
      data-chat-timeline-entry="user"
      data-chat-message-row="user"
      className="flex items-start justify-end px-3 pt-3"
    >
      <ConversationItem role="user">{label}</ConversationItem>
    </div>
  );
};

"use client";

import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { HitlConfirmStayModal } from "./HitlConfirmStayModal";
import type {
  ConfirmModifyBookingArgs,
  ConfirmModifyBookingResult,
} from "@/features/booking/schemas";

type ConfirmModifyBookingModalProps = {
  status: ToolCallStatus;
  args: Partial<ConfirmModifyBookingArgs>;
  respond?: (result: ConfirmModifyBookingResult) => Promise<void>;
  result?: unknown;
  toolCallId?: string;
};

export const ConfirmModifyBookingModal = ({
  status,
  args,
  respond,
  result,
  toolCallId,
}: ConfirmModifyBookingModalProps) => (
  <HitlConfirmStayModal
    variant="modify"
    status={status}
    args={args}
    respond={respond}
    result={result}
    toolCallId={toolCallId}
  />
);

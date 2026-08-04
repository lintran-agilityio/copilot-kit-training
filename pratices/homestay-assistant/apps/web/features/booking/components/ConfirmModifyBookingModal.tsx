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
};

export const ConfirmModifyBookingModal = ({
  status,
  args,
  respond,
  result,
}: ConfirmModifyBookingModalProps) => (
  <HitlConfirmStayModal
    variant="modify"
    status={status}
    args={args}
    respond={respond}
    result={result}
  />
);

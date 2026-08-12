"use client";

import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { HitlConfirmStayModal } from "./HitlConfirmStayModal";
import type {
  ConfirmBookingArgs,
  ConfirmBookingResult,
} from "@repo/schemas";
import type { HitlToolResult } from "@/features/booking/types";

type ConfirmBookingModalProps = {
  status: ToolCallStatus;
  args: Partial<ConfirmBookingArgs>;
  respond?: (result: ConfirmBookingResult) => Promise<void>;
  result?: HitlToolResult<ConfirmBookingResult>;
  toolCallId?: string;
};

export const ConfirmBookingModal = ({
  status,
  args,
  respond,
  result,
  toolCallId,
}: ConfirmBookingModalProps) => (
  <HitlConfirmStayModal
    variant="create"
    status={status}
    args={args}
    respond={respond}
    result={result}
    toolCallId={toolCallId}
  />
);

"use client";

import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { HitlConfirmStayModal } from "./HitlConfirmStayModal";
import type {
  ConfirmBookingArgs,
  ConfirmBookingResult,
} from "@/features/booking/schemas";

type ConfirmBookingModalProps = {
  status: ToolCallStatus;
  args: Partial<ConfirmBookingArgs>;
  respond?: (result: ConfirmBookingResult) => Promise<void>;
  result?: unknown;
};

export const ConfirmBookingModal = ({
  status,
  args,
  respond,
  result,
}: ConfirmBookingModalProps) => (
  <HitlConfirmStayModal
    variant="create"
    status={status}
    args={args}
    respond={respond}
    result={result}
  />
);

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
};

export const ConfirmBookingModal = (props: ConfirmBookingModalProps) => (
  <HitlConfirmStayModal variant="create" {...props} />
);

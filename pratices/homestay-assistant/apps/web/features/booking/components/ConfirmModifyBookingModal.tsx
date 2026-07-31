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
};

export const ConfirmModifyBookingModal = (
  props: ConfirmModifyBookingModalProps,
) => <HitlConfirmStayModal variant="modify" {...props} />;

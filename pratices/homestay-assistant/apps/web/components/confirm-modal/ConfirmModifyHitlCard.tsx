"use client";

import type { ReactNode } from "react";
import { CalendarCheck } from "lucide-react";

import { ChangeSummary } from "@/components/confirm-modal/ChangeSummary";
import { ConfirmHitlCard } from "@/components/confirm-modal/ConfirmHitlCard";
import {
  CONFIRM_MODIFY_BOOKING,
  getFailureMessage,
  MODEL_NAME,
  HITL_CARD_PHASE,
  type HitlCardPhase,
} from "@/features/booking/constants";
import type { HitlDecisionStatus } from "@/features/booking/utils/hitl-decision-status";
import type { ModifyStaySnapshot } from "@/features/booking/types/booking";
import { buildModifyChangeRows } from "@/features/booking/utils/build-modify-change-rows";

export type ConfirmModifyHitlCardProps = {
  roomName: string;
  pricePerNight: number;
  original: ModifyStaySnapshot;
  next: ModifyStaySnapshot;
  title?: string;
  description?: ReactNode;
  confirmLabel?: string;
  submittingLabel?: string;
  isSubmitting?: boolean;
  canRespond?: boolean;
  errorMessage?: string | null;
  decisionStatus?: HitlDecisionStatus;
  /**
   * When set, modify-flow same-card phases own the UI (review → submitting →
   * success | failed | cancelled | expired).
   */
  modifyPhase?: HitlCardPhase;
  failureReason?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  onViewBookings?: () => void;
  onRetry?: () => void;
};

/**
 * Modify HITL card with before → after ChangeSummary.
 * Inline chat card — not a modal overlay.
 */
export const ConfirmModifyHitlCard = ({
  roomName,
  pricePerNight,
  original,
  next,
  title = CONFIRM_MODIFY_BOOKING.title.review,
  description,
  confirmLabel = CONFIRM_MODIFY_BOOKING.label.confirm,
  submittingLabel = CONFIRM_MODIFY_BOOKING.label.submitting,
  isSubmitting = false,
  canRespond = true,
  errorMessage = null,
  modifyPhase,
  failureReason = null,
  onCancel,
  onConfirm,
  onViewBookings,
  onRetry,
}: ConfirmModifyHitlCardProps) => {
  const actionsDisabled = !canRespond || isSubmitting;
  const changes = buildModifyChangeRows(original, next, pricePerNight);
  const phase = modifyPhase ?? HITL_CARD_PHASE.REVIEW;
  const reviewDescription = description ?? (
    <>
      Review the changes for your stay at{" "}
      <span className="font-medium text-zinc-200">{roomName}</span> before
      saving.
    </>
  );

  return (
    <ConfirmHitlCard
      phase={phase}
      summary={<ChangeSummary changes={changes} />}
      accent="emerald"
      icon={CalendarCheck}
      confirmIcon={CalendarCheck}
      title={title}
      description={reviewDescription}
      confirmLabel={confirmLabel}
      submittingLabel={submittingLabel}
      submittingTitle={CONFIRM_MODIFY_BOOKING.title.submitting}
      submittingDescription={
        <>
          Please wait while we update your stay at{" "}
          <span className="font-medium text-zinc-200">{roomName}</span>.
        </>
      }
      successTitle={CONFIRM_MODIFY_BOOKING.title.success}
      successDescription={
        <>
          Your stay at{" "}
          <span className="font-medium text-zinc-200">{roomName}</span> has been
          updated.
        </>
      }
      failedTitle={CONFIRM_MODIFY_BOOKING.title.failed}
      failureMessage={
        failureReason?.trim() || getFailureMessage(MODEL_NAME.MODIFY)
      }
      cancelledTitle={CONFIRM_MODIFY_BOOKING.title.rejected}
      cancelledDescription={
        <>
          You cancelled confirmation for{" "}
          <span className="font-medium text-zinc-200">{roomName}</span>.
        </>
      }
      expiredTitle={CONFIRM_MODIFY_BOOKING.title.expired}
      expiredDescription={
        <>
          This confirmation for{" "}
          <span className="font-medium text-zinc-200">{roomName}</span> is no
          longer available.
        </>
      }
      cancelLabel={CONFIRM_MODIFY_BOOKING.label.cancel}
      viewBookingsLabel={CONFIRM_MODIFY_BOOKING.label.viewBookings}
      retryLabel={CONFIRM_MODIFY_BOOKING.label.retry}
      actionsDisabled={actionsDisabled}
      confirmDisabled={changes.length === 0}
      errorMessage={errorMessage}
      onCancel={onCancel}
      onConfirm={onConfirm}
      onViewBookings={onViewBookings}
      onRetry={onRetry}
    />
  );
};

/** @deprecated Use ConfirmModifyHitlCard */
export const ConfirmModifyBookingDialog = ConfirmModifyHitlCard;
/** @deprecated Use ConfirmModifyHitlCardProps */
export type ConfirmModifyBookingDialogProps = ConfirmModifyHitlCardProps;

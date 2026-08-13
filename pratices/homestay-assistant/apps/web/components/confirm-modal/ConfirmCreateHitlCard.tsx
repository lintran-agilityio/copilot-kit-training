"use client";

import type { ReactNode } from "react";
import { CalendarCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmHitlCard } from "@/components/confirm-modal/ConfirmHitlCard";
import { ConfirmHitlHeader } from "@/components/confirm-modal/ConfirmHitlHeader";
import { StaySummary } from "@/components/confirm-modal/StaySummary";
import {
  CONFIRM_BOOKING,
  CONFIRM_MODIFY_BOOKING,
  getFailureMessage,
  MODEL_NAME,
  MODIFY_PENDING_TITLES,
  type HitlCardPhase,
} from "@/features/booking/constants";
import {
  isHitlDecisionTerminal,
  type HitlDecisionStatus,
} from "@/features/booking/utils";
import { countNightOfDates } from "@repo/utils";
import { HITL_DECISION_STATUS } from "@/constants";

export type ConfirmCreateHitlCardProps = {
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  pricePerNight: number;
  title?: string;
  description?: ReactNode;
  confirmLabel?: string;
  submittingLabel?: string;
  isSubmitting?: boolean;
  canRespond?: boolean;
  errorMessage?: string | null;
  decisionStatus?: HitlDecisionStatus;
  /**
   * When set, create-flow same-card phases own the UI (review → submitting →
   * success | failed). Omit for modify fallback / legacy decisionStatus settle.
   */
  createPhase?: HitlCardPhase;
  /**
   * When set, modify-flow same-card phases own the UI (used by modify fallback
   * when originals are missing). Takes precedence over legacy settle when set.
   */
  modifyPhase?: HitlCardPhase;
  failureReason?: string | null;
  totalPriceOverride?: number;
  onCancel: () => void;
  onConfirm: () => void;
  onViewBookings?: () => void;
  onRetry?: () => void;
};

type SettledCopy = {
  title: string;
  description: ReactNode;
};

const CREATE_TITLE = CONFIRM_BOOKING.title;
const CREATE_LABEL = CONFIRM_BOOKING.label;
const MODIFY_TITLE = CONFIRM_MODIFY_BOOKING.title;
const MODIFY_LABEL = CONFIRM_MODIFY_BOOKING.label;

const getSettledCopy = (
  decisionStatus: HitlDecisionStatus,
  isModify: boolean,
  roomName: string,
): SettledCopy => {
  switch (decisionStatus) {
    case HITL_DECISION_STATUS.APPROVED:
      return {
        title: isModify ? MODIFY_TITLE.approved : CREATE_TITLE.approved,
        description: (
          <>
            You confirmed your stay at{" "}
            <span className="font-medium text-zinc-200">{roomName}</span>.
          </>
        ),
      };
    case HITL_DECISION_STATUS.REJECTED:
      return {
        title: isModify ? MODIFY_TITLE.rejected : CREATE_TITLE.rejected,
        description: (
          <>
            You cancelled confirmation for{" "}
            <span className="font-medium text-zinc-200">{roomName}</span>.
          </>
        ),
      };
    default:
      return {
        title: isModify ? MODIFY_TITLE.expired : CREATE_TITLE.expired,
        description: (
          <>
            This confirmation for{" "}
            <span className="font-medium text-zinc-200">{roomName}</span> is no
            longer available.
          </>
        ),
      };
  }
};

/**
 * Create HITL card (and modify-fallback without originals).
 * Inline chat card — not a modal overlay.
 * Legacy: settles via decisionStatus when no phase prop is set.
 */
export const ConfirmCreateHitlCard = ({
  roomName,
  checkInDate,
  checkOutDate,
  guests,
  pricePerNight,
  title = CREATE_TITLE.review,
  description,
  confirmLabel = CREATE_LABEL.confirm,
  submittingLabel = CREATE_LABEL.submitting,
  isSubmitting = false,
  canRespond = true,
  errorMessage = null,
  decisionStatus = HITL_DECISION_STATUS.PENDING,
  createPhase,
  modifyPhase,
  failureReason = null,
  totalPriceOverride,
  onCancel,
  onConfirm,
  onViewBookings,
  onRetry,
}: ConfirmCreateHitlCardProps) => {
  const actionsDisabled = !canRespond || isSubmitting;
  const nights = countNightOfDates(checkInDate, checkOutDate);
  const totalPrice = totalPriceOverride ?? nights * pricePerNight;
  const isModify = MODIFY_PENDING_TITLES.has(title);
  const summary = (
    <StaySummary
      roomName={roomName}
      checkInDate={checkInDate}
      checkOutDate={checkOutDate}
      guests={guests}
      totalPrice={totalPrice}
    />
  );

  if (createPhase) {
    return (
      <ConfirmHitlCard
        phase={createPhase}
        summary={summary}
        accent="emerald"
        icon={CalendarCheck}
        confirmIcon={CalendarCheck}
        title={title}
        description={
          description ?? (
            <>
              Review the details below before confirming your stay at{" "}
              <span className="font-medium text-zinc-200">{roomName}</span>.
            </>
          )
        }
        confirmLabel={confirmLabel}
        submittingLabel={submittingLabel}
        submittingTitle={CREATE_TITLE.submitting}
        submittingDescription={
          <>
            Please wait while we confirm your stay at{" "}
            <span className="font-medium text-zinc-200">{roomName}</span>.
          </>
        }
        successTitle={CREATE_TITLE.success}
        successDescription={
          <>
            Your stay at{" "}
            <span className="font-medium text-zinc-200">{roomName}</span> has
            been booked.
          </>
        }
        failedTitle={CREATE_TITLE.failed}
        failureMessage={
          failureReason?.trim() || getFailureMessage(MODEL_NAME.CREATE)
        }
        cancelledTitle={CREATE_TITLE.rejected}
        cancelledDescription={
          <>
            You cancelled confirmation for{" "}
            <span className="font-medium text-zinc-200">{roomName}</span>.
          </>
        }
        expiredTitle={CREATE_TITLE.expired}
        expiredDescription={
          <>
            This confirmation for{" "}
            <span className="font-medium text-zinc-200">{roomName}</span> is no
            longer available.
          </>
        }
        cancelLabel={CREATE_LABEL.cancel}
        viewBookingsLabel={CREATE_LABEL.viewBookings}
        retryLabel={CREATE_LABEL.retry}
        actionsDisabled={actionsDisabled}
        errorMessage={errorMessage}
        onCancel={onCancel}
        onConfirm={onConfirm}
        onViewBookings={onViewBookings}
        onRetry={onRetry}
      />
    );
  }

  if (modifyPhase) {
    return (
      <ConfirmHitlCard
        phase={modifyPhase}
        summary={summary}
        accent="emerald"
        icon={CalendarCheck}
        confirmIcon={CalendarCheck}
        title={title}
        description={
          description ?? (
            <>
              Review the changes for your stay at{" "}
              <span className="font-medium text-zinc-200">{roomName}</span>{" "}
              before saving.
            </>
          )
        }
        confirmLabel={confirmLabel}
        submittingLabel={submittingLabel}
        submittingTitle={MODIFY_TITLE.submitting}
        submittingDescription={
          <>
            Please wait while we update your stay at{" "}
            <span className="font-medium text-zinc-200">{roomName}</span>.
          </>
        }
        successTitle={MODIFY_TITLE.success}
        successDescription={
          <>
            Your stay at{" "}
            <span className="font-medium text-zinc-200">{roomName}</span> has
            been updated.
          </>
        }
        failedTitle={MODIFY_TITLE.failed}
        failureMessage={
          failureReason?.trim() || getFailureMessage(MODEL_NAME.MODIFY)
        }
        cancelledTitle={MODIFY_TITLE.rejected}
        cancelledDescription={
          <>
            You cancelled confirmation for{" "}
            <span className="font-medium text-zinc-200">{roomName}</span>.
          </>
        }
        expiredTitle={MODIFY_TITLE.expired}
        expiredDescription={
          <>
            This confirmation for{" "}
            <span className="font-medium text-zinc-200">{roomName}</span> is no
            longer available.
          </>
        }
        cancelLabel={MODIFY_LABEL.cancel}
        viewBookingsLabel={MODIFY_LABEL.viewBookings}
        retryLabel={MODIFY_LABEL.retry}
        actionsDisabled={actionsDisabled}
        errorMessage={errorMessage}
        onCancel={onCancel}
        onConfirm={onConfirm}
        onViewBookings={onViewBookings}
        onRetry={onRetry}
      />
    );
  }

  // Legacy create-only settle path when no phase prop is set.
  const isComplete = isHitlDecisionTerminal(decisionStatus);
  const settled = isComplete
    ? getSettledCopy(decisionStatus, isModify, roomName)
    : null;
  const displayTitle = settled?.title ?? title;
  const displayDescription = settled?.description ?? (
    description ?? (
      <>
        Review the details below before confirming your stay at{" "}
        <span className="font-medium text-zinc-200">{roomName}</span>.
      </>
    )
  );

  return (
    <div className="space-y-3 p-3.5 text-zinc-100">
      <ConfirmHitlHeader
        tone="emerald"
        icon={<CalendarCheck className="size-4" aria-hidden />}
        title={displayTitle}
        description={displayDescription}
      />

      {summary}

      {errorMessage ? (
        <p className="text-xs text-red-400">{errorMessage}</p>
      ) : null}

      {isComplete ? null : (
        <div className="flex flex-wrap gap-2 pt-0.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-white/10 bg-transparent text-zinc-200 hover:bg-white/5 hover:text-white cursor-pointer"
            disabled={actionsDisabled}
            onClick={onCancel}
          >
            {CREATE_LABEL.cancel}
          </Button>
          <Button
            type="button"
            size="sm"
            className="gap-1.5 bg-emerald-500 text-black hover:bg-emerald-400 cursor-pointer"
            disabled={actionsDisabled}
            onClick={onConfirm}
          >
            <CalendarCheck className="size-3.5" />
            {isSubmitting ? submittingLabel : confirmLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

/** @deprecated Use ConfirmCreateHitlCard */
export const ConfirmBookingDialog = ConfirmCreateHitlCard;
/** @deprecated Use ConfirmCreateHitlCardProps */
export type ConfirmBookingDialogProps = ConfirmCreateHitlCardProps;

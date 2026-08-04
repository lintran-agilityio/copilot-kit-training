"use client";

import type { ReactNode } from "react";
import { CalendarCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  HITL_DECISION_STATUS,
  isHitlDecisionTerminal,
  type HitlDecisionStatus,
} from "@/features/booking/utils/hitl-decision-status";
import {
  countNightOfDates,
  formatPrice,
  formatShortDateForDisplay,
} from "@repo/utils";

export type ConfirmBookingDialogProps = {
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
  onCancel: () => void;
  onConfirm: () => void;
};

const MODIFY_PENDING_TITLE = "Confirm booking changes?";

const getSettledCopy = (
  decisionStatus: HitlDecisionStatus,
  isModify: boolean,
  roomName: string,
): { title: string; description: ReactNode } => {
  if (decisionStatus === HITL_DECISION_STATUS.APPROVED) {
    return {
      title: isModify ? "Changes confirmed by you" : "Confirmed by you",
      description: (
        <>
          You confirmed your stay at{" "}
          <span className="font-medium text-zinc-200">{roomName}</span>.
        </>
      ),
    };
  }

  if (decisionStatus === HITL_DECISION_STATUS.REJECTED) {
    return {
      title: isModify ? "Changes cancelled by you" : "Cancelled by you",
      description: (
        <>
          You cancelled confirmation for{" "}
          <span className="font-medium text-zinc-200">{roomName}</span>.
        </>
      ),
    };
  }

  return {
    title: isModify ? "Change confirmation expired" : "Confirmation expired",
    description: (
      <>
        This confirmation for{" "}
        <span className="font-medium text-zinc-200">{roomName}</span> is no
        longer available.
      </>
    ),
  };
};

/**
 * Inline HITL confirmation card for chat (not a modal overlay).
 * Remains in history after decide — title becomes Confirmed/Cancelled by you;
 * buttons are removed so it reads as the request step, not a second outcome.
 */
export const ConfirmBookingDialog = ({
  roomName,
  checkInDate,
  checkOutDate,
  guests,
  pricePerNight,
  title = "Confirm your booking?",
  description,
  confirmLabel = "Confirm booking",
  submittingLabel = "Confirming…",
  isSubmitting = false,
  canRespond = true,
  errorMessage = null,
  decisionStatus = HITL_DECISION_STATUS.PENDING,
  onCancel,
  onConfirm,
}: ConfirmBookingDialogProps) => {
  const actionsDisabled = !canRespond || isSubmitting;
  const isComplete = isHitlDecisionTerminal(decisionStatus);
  const nights = countNightOfDates(checkInDate, checkOutDate);
  const totalPrice = nights * pricePerNight;
  const isModify = title === MODIFY_PENDING_TITLE;
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
      <div className="flex items-start gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          <CalendarCheck className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="text-sm font-medium text-white">{displayTitle}</h3>
          <p className="text-xs text-zinc-400">{displayDescription}</p>
        </div>
      </div>

      <dl className="space-y-1.5 rounded-lg border border-white/8 bg-white/[0.02] p-3 text-xs">
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">Room</dt>
          <dd className="text-right text-zinc-100">{roomName}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">Dates</dt>
          <dd className="text-right text-zinc-100">
            {formatShortDateForDisplay(checkInDate)} →{" "}
            {formatShortDateForDisplay(checkOutDate)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">Guests</dt>
          <dd className="text-right text-zinc-100">{guests}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-white/8 pt-1.5">
          <dt className="text-zinc-500">Total</dt>
          <dd className="text-right font-medium text-emerald-300">
            {formatPrice(totalPrice)}
          </dd>
        </div>
      </dl>

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
            Cancel
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

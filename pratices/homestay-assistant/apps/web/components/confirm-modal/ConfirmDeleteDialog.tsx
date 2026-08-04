"use client";

import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  HITL_DECISION_STATUS,
  isHitlDecisionTerminal,
  type HitlDecisionStatus,
} from "@/features/booking/utils/hitl-decision-status";
import { formatPrice } from "@repo/utils";
import { BookingDetails } from "@/features/booking/types";

export type ConfirmDeleteDialogProps = {
  booking: BookingDetails;
  isDeleting?: boolean;
  canRespond?: boolean;
  errorMessage?: string | null;
  decisionStatus?: HitlDecisionStatus;
  onCancel: () => void;
  onConfirm: () => void;
};

const getSettledCopy = (
  decisionStatus: HitlDecisionStatus,
  roomName: string,
): { title: string; description: ReactNode } => {
  if (decisionStatus === HITL_DECISION_STATUS.APPROVED) {
    return {
      title: "Confirmed by you",
      description: (
        <>
          You confirmed cancellation of your stay at{" "}
          <span className="font-medium text-zinc-200">{roomName}</span>.
        </>
      ),
    };
  }

  if (decisionStatus === HITL_DECISION_STATUS.REJECTED) {
    return {
      title: "Cancelled by you",
      description: (
        <>
          You kept your reservation for{" "}
          <span className="font-medium text-zinc-200">{roomName}</span>.
        </>
      ),
    };
  }

  return {
    title: "Confirmation expired",
    description: (
      <>
        This cancellation confirmation for{" "}
        <span className="font-medium text-zinc-200">{roomName}</span> is no
        longer available.
      </>
    ),
  };
};

/**
 * Inline HITL cancel card for chat (not a modal overlay).
 * Remains in history after decide — title becomes Confirmed/Cancelled by you;
 * buttons are removed so it reads as the request step, not a second outcome.
 */
export const ConfirmDeleteDialog = ({
  booking,
  isDeleting = false,
  canRespond = true,
  errorMessage = null,
  decisionStatus = HITL_DECISION_STATUS.PENDING,
  onCancel,
  onConfirm,
}: ConfirmDeleteDialogProps) => {
  const actionsDisabled = !canRespond || isDeleting;
  const isComplete = isHitlDecisionTerminal(decisionStatus);
  const { roomName, checkInDate, checkOutDate, guests, totalPrice } = booking;
  const settled = isComplete ? getSettledCopy(decisionStatus, roomName) : null;

  return (
    <div className="space-y-3 p-3.5 text-zinc-100">
      <div className="flex items-start gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <AlertTriangle className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="text-sm font-medium text-white">
            {settled?.title ?? "Cancel this booking?"}
          </h3>
          <p className="text-xs text-zinc-400">
            {settled?.description ?? (
              <>
                This will cancel your reservation for{" "}
                <span className="font-medium text-zinc-200">{roomName}</span>.
                This action cannot be undone.
              </>
            )}
          </p>
        </div>
      </div>

      <dl className="space-y-1.5 rounded-lg border border-white/8 bg-white/[0.02] p-3 text-xs">
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">Dates</dt>
          <dd className="text-right text-zinc-100">
            {checkInDate} → {checkOutDate}
          </dd>
        </div>
        {guests ? (
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Guests</dt>
            <dd className="text-right text-zinc-100">{guests}</dd>
          </div>
        ) : null}
        {totalPrice ? (
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Total</dt>
            <dd className="text-right font-medium text-emerald-300">
              {formatPrice(totalPrice)}
            </dd>
          </div>
        ) : null}
      </dl>

      {errorMessage ? (
        <p className="text-xs text-destructive">{errorMessage}</p>
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
            Keep booking
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={actionsDisabled}
            onClick={onConfirm}
            className="cursor-pointer"
          >
            {isDeleting ? "Cancelling…" : "Cancel booking"}
          </Button>
        </div>
      )}
    </div>
  );
};

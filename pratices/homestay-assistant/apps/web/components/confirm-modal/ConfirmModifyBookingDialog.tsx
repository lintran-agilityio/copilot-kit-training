"use client";

import type { ReactNode } from "react";
import { CalendarCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  HITL_DECISION_STATUS,
  isHitlDecisionTerminal,
  type HitlDecisionStatus,
} from "@/features/booking/utils/hitl-decision-status";
import type { ModifyStaySnapshot } from "@/features/booking/types/booking";
import {
  countNightOfDates,
  formatPrice,
  formatShortDateForDisplay,
} from "@repo/utils";

export type ConfirmModifyBookingDialogProps = {
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
  onCancel: () => void;
  onConfirm: () => void;
};

type ChangeRow = {
  label: string;
  from: string;
  to: string;
};

const getSettledCopy = (
  decisionStatus: HitlDecisionStatus,
  roomName: string,
): { title: string; description: ReactNode } => {
  if (decisionStatus === HITL_DECISION_STATUS.APPROVED) {
    return {
      title: "Changes confirmed by you",
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
      title: "Changes cancelled by you",
      description: (
        <>
          You cancelled confirmation for{" "}
          <span className="font-medium text-zinc-200">{roomName}</span>.
        </>
      ),
    };
  }

  return {
    title: "Change confirmation expired",
    description: (
      <>
        This confirmation for{" "}
        <span className="font-medium text-zinc-200">{roomName}</span> is no
        longer available.
      </>
    ),
  };
};

export const buildModifyChangeRows = (
  original: ModifyStaySnapshot,
  next: ModifyStaySnapshot,
  pricePerNight: number,
): ChangeRow[] => {
  const rows: ChangeRow[] = [];

  if (original.guests !== next.guests) {
    rows.push({
      label: "Guests",
      from: String(original.guests),
      to: String(next.guests),
    });
  }

  if (original.checkInDate !== next.checkInDate) {
    rows.push({
      label: "Check-in",
      from: formatShortDateForDisplay(original.checkInDate),
      to: formatShortDateForDisplay(next.checkInDate),
    });
  }

  if (original.checkOutDate !== next.checkOutDate) {
    rows.push({
      label: "Check-out",
      from: formatShortDateForDisplay(original.checkOutDate),
      to: formatShortDateForDisplay(next.checkOutDate),
    });
  }

  const originalTotal =
    countNightOfDates(original.checkInDate, original.checkOutDate) *
    pricePerNight;
  const nextTotal =
    countNightOfDates(next.checkInDate, next.checkOutDate) * pricePerNight;

  if (originalTotal !== nextTotal) {
    rows.push({
      label: "Total",
      from: formatPrice(originalTotal) ?? String(originalTotal),
      to: formatPrice(nextTotal) ?? String(nextTotal),
    });
  }

  return rows;
};

/**
 * Inline HITL confirmation card for modify booking (not a modal overlay).
 * Shows only changed fields as before → after diffs.
 */
export const ConfirmModifyBookingDialog = ({
  roomName,
  pricePerNight,
  original,
  next,
  title = "Modify booking",
  description,
  confirmLabel = "Confirm Changes",
  submittingLabel = "Updating…",
  isSubmitting = false,
  canRespond = true,
  errorMessage = null,
  decisionStatus = HITL_DECISION_STATUS.PENDING,
  onCancel,
  onConfirm,
}: ConfirmModifyBookingDialogProps) => {
  const actionsDisabled = !canRespond || isSubmitting;
  const isComplete = isHitlDecisionTerminal(decisionStatus);
  const changes = buildModifyChangeRows(original, next, pricePerNight);
  const showChangesHeading = changes.length > 1;
  const settled = isComplete
    ? getSettledCopy(decisionStatus, roomName)
    : null;
  const displayTitle = settled?.title ?? title;
  const displayDescription = settled?.description ?? (
    description ?? (
      <>
        Review the changes for your stay at{" "}
        <span className="font-medium text-zinc-200">{roomName}</span> before
        saving.
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
        {showChangesHeading ? (
          <div className="pb-0.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Changes
          </div>
        ) : null}

        {changes.length === 0 ? (
          <p className="text-zinc-500">No field changes detected.</p>
        ) : (
          changes.map((row, index) => (
            <div
              key={row.label}
              className={
                row.label === "Total"
                  ? `flex justify-between gap-4 ${index > 0 ? "border-t border-white/8 pt-1.5" : ""}`
                  : "flex justify-between gap-4"
              }
            >
              <dt className="text-zinc-500">{row.label}</dt>
              <dd
                className={
                  row.label === "Total"
                    ? "text-right font-medium text-emerald-300"
                    : "text-right text-zinc-100"
                }
              >
                <span className="text-zinc-500">{row.from}</span>
                <span className="mx-1.5 text-zinc-600">→</span>
                <span>{row.to}</span>
              </dd>
            </div>
          ))
        )}
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
            disabled={actionsDisabled || changes.length === 0}
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

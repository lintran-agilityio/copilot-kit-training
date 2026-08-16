import { CheckCircle2, CircleSlash, Clock3, XCircle } from "lucide-react";

import { cn } from "@repo/utils";

import { type HitlDecisionStatus } from "@/features/booking/utils";
import { HITL_DECISION_STATUS } from "@/constants";

const STATUS_META: Record<
  Exclude<HitlDecisionStatus, "pending">,
  {
    label: string;
    icon: typeof CheckCircle2;
    className: string;
  }
> = {
  [HITL_DECISION_STATUS.APPROVED]: {
    label: "Approved",
    icon: CheckCircle2,
    className: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  },
  [HITL_DECISION_STATUS.REJECTED]: {
    label: "Rejected",
    icon: XCircle,
    className: "border-zinc-500/30 bg-zinc-500/15 text-zinc-400",
  },
  [HITL_DECISION_STATUS.EXPIRED]: {
    label: "Expired",
    icon: CircleSlash,
    className: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  },
};

type HitlDecisionStatusBadgeProps = {
  status: HitlDecisionStatus;
  className?: string;
};

export const HitlDecisionStatusBadge = ({
  status,
  className,
}: HitlDecisionStatusBadgeProps) => {
  if (status === HITL_DECISION_STATUS.PENDING) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/15 px-2.5 py-1 text-[11px] font-medium tracking-wide uppercase text-sky-300",
          className,
        )}
      >
        <Clock3 className="size-3.5" aria-hidden />
        Awaiting confirmation
      </span>
    );
  }

  const meta = STATUS_META[status];
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide uppercase",
        meta.className,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {meta.label}
    </span>
  );
};

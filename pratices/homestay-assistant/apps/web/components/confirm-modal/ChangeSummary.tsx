"use client";

import type { ModifyChangeRow } from "@/features/booking/utils/build-modify-change-rows";

export type ChangeSummaryProps = {
  changes: ModifyChangeRow[];
};

/**
 * Modify-only before → after summary. Do not reuse for create/cancel.
 */
export const ChangeSummary = ({ changes }: ChangeSummaryProps) => {
  const showChangesHeading = changes.length > 1;

  return (
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
  );
};

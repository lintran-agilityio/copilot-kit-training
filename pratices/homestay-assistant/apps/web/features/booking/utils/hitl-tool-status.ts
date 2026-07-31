import { ToolCallStatus } from "@copilotkit/react-core/v2";
import { useCallback, useRef, useState } from "react";

/**
 * CopilotKit v2 tool lifecycle (`@copilotkit/core` ToolCallStatus):
 * `inProgress` → `executing` → `complete` — no separate "awaiting respond" status.
 *
 * `useHumanInTheLoop` passes `respond` only while status is `executing`
 * (`InProgress` and `Complete` get `respond: undefined`). HITL modals must
 * gate on `Executing`, not `InProgress` (backend `useRenderTool` UIs often
 * treat both as in-flight — that pattern must not be copied here).
 */
export const isHitlToolInProgress = (status: ToolCallStatus) =>
  status === ToolCallStatus.InProgress;

/** User can submit `respond()` — the only HITL phase where CK wires `respond`. */
export const isHitlToolAwaitingUser = (status: ToolCallStatus) =>
  status === ToolCallStatus.Executing;

export const isHitlToolFinished = (status: ToolCallStatus) =>
  status === ToolCallStatus.Complete;

export const isHitlToolRespondable = <T>(
  status: ToolCallStatus,
  respond: ((result: T) => Promise<void>) | undefined,
): respond is (result: T) => Promise<void> =>
  isHitlToolAwaitingUser(status) && respond != null;

/**
 * Ensures HITL `respond` runs at most once.
 * Dialog unmount / onOpenChange(false) can otherwise fire a second
 * respond (e.g. confirmed:false after a successful confirm), which
 * races the agent and can skip follow-up tools like update_booking.
 */
export const useHitlRespondOnce = <T>(
  respond?: (result: T) => Promise<void>,
) => {
  const hasRespondedRef = useRef(false);
  const [hasResponded, setHasResponded] = useState(false);

  const respondOnce = useCallback(
    async (result: T) => {
      if (!respond || hasRespondedRef.current) {
        return;
      }

      hasRespondedRef.current = true;
      setHasResponded(true);

      try {
        await respond(result);
      } catch (error) {
        hasRespondedRef.current = false;
        setHasResponded(false);
        throw error;
      }
    },
    [respond],
  );

  return {
    respondOnce,
    canRespond: respond != null && !hasResponded,
  };
};

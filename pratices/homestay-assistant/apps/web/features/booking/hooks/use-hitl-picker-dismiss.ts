import { useCallback } from "react";

import { useSupersedeHitlOnNewInteraction } from "@/features/chat/hooks";
import { useHitlRespondOnce } from "@/features/booking/utils";

/**
 * Shared HITL wiring for disambiguation pickers (cancel/modify): responds at
 * most once, and auto-declines with `declineResult` when a new interaction
 * supersedes this pending pick.
 */
export const useHitlPickerDismiss = <T>(
  respond: ((result: T) => Promise<void>) | undefined,
  toolCallId: string | undefined,
  declineResult: T,
) => {
  const { respondOnce, canRespond: canRespondHitl } =
    useHitlRespondOnce<T>(respond);

  const supersedeDismiss = useCallback(() => {
    void respondOnce(declineResult);
  }, [respondOnce, declineResult]);

  const { isActionable, expiredBySupersede } = useSupersedeHitlOnNewInteraction({
    toolCallId,
    canRespond: canRespondHitl,
    onSupersede: supersedeDismiss,
  });

  return {
    respondOnce,
    canRespond: canRespondHitl && isActionable,
    isActionable,
    expiredBySupersede,
  };
};

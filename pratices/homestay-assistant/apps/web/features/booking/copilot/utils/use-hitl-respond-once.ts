"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Ensures HITL `respond` runs at most once.
 * Dialog unmount / onOpenChange(false) can otherwise fire a second
 * respond (e.g. confirmed:false after a successful confirm), which
 * races the agent and can skip follow-up tools like update_booking.
 */
export function useHitlRespondOnce<T>(
  respond?: (result: T) => Promise<void>,
) {
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
}

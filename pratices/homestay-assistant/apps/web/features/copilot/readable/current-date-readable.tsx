"use client";

import { useMemo } from "react";
import { useAgentContext } from "@copilotkit/react-core/v2";
import { getBusinessDates } from "@repo/utils/date";

/**
 * Always injects today's calendar date into agent context so relative
 * phrases like "tomorrow" resolve correctly (models have no wall clock).
 */
export const CurrentDateReadable = () => {
  const value = useMemo(() => getBusinessDates(), []);

  useAgentContext({
    description: "Authoritative business calendar. Resolve relative dates using today and tomorrow.",
    value,
  });

  return null;
};

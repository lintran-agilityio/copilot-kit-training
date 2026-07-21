"use client";

import { useMemo } from "react";
import { useAgentContext } from "@copilotkit/react-core/v2";

import { useHomestayAgentContext } from "@/features/chat/hooks/use-homestay-agent-context";

export const HomestayAgentContext = () => {
  const context = useHomestayAgentContext();
  // Pass a stable string so useAgentContext does not add/remove on object identity churn.
  const value = useMemo(() => JSON.stringify(context), [context]);

  useAgentContext({
    description:
      "HomestayAgentContext: screen (home | room-detail | booking-form | bookings), optional focus (room|booking + id), optional task (discover|book|cancel|manage + status). Match tools/replies to this context; never invent focus ids. Relative stay dates are resolved from the separate Current Date agent context (today/tomorrow), not from prior chat turns.",
    value,
  });

  return null;
};

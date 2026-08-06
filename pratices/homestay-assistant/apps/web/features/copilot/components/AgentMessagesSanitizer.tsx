"use client";

/**
 * Temporary compatibility: collapses same-id / twin assistant rows that still
 * arrive from Intelligence reconnect. Prefer fixing uniqueness in AG-UI
 * (`stream-patch`) / memory, then remove this component.
 *
 * Blocked-message presentation is derived at render (see blocked-messages.ts),
 * not rewritten here via setMessages.
 */

import { useEffect, useRef } from "react";
import { useAgent } from "@copilotkit/react-core/v2";

import { AGENT_KEYS } from "@repo/constants";
import { normalizeMessages } from "@/features/chat/utils";

export const AgentMessagesSanitizer = () => {
  const { agent } = useAgent({ agentId: AGENT_KEYS.MANAGE_ASSISTANT });
  const isSanitizingRef = useRef(false);

  useEffect(() => {
    if (isSanitizingRef.current || typeof agent.setMessages !== "function") {
      return;
    }

    const sanitized = normalizeMessages(agent.messages);
    const before = JSON.stringify(agent.messages);
    const after = JSON.stringify(sanitized);

    if (before === after) {
      return;
    }

    isSanitizingRef.current = true;

    try {
      agent.setMessages(sanitized);
    } finally {
      isSanitizingRef.current = false;
    }
  }, [agent, agent.messages]);

  return null;
};

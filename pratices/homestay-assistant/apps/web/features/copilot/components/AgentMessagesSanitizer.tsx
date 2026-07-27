"use client";

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

    if (
      sanitized.length === agent.messages.length &&
      sanitized.every((message, index) => message === agent.messages[index])
    ) {
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

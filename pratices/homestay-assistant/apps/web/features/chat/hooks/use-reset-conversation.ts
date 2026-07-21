"use client";

import { useResetThread } from "@/features/threads/hooks/useResetThread";

type UseResetConversationOptions = {
  agentId: string;
};

/**
 * Clears the current conversation UI while keeping the same thread id.
 * Prefer `useCreateThread` when starting a brand-new conversation context.
 */
export const useResetConversation = ({
  agentId,
}: UseResetConversationOptions) => {
  const { resetThread } = useResetThread({ agentId });

  return { resetConversation: resetThread };
};

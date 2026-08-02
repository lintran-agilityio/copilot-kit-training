"use client";

import { useResetThread } from "@/features/threads/hooks/useResetThread";

type UseResetConversationOptions = {
  agentId: string;
};

/**
 * Deletes the current conversation and starts an empty one.
 * Prefer `useCreateThread` when the existing conversation must be kept.
 */
export const useResetConversation = ({
  agentId,
}: UseResetConversationOptions) => {
  const { resetThread } = useResetThread({ agentId });

  return { resetConversation: resetThread };
};

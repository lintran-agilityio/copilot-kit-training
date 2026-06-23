"use client";

import { useEffect, useRef } from "react";

import { Role } from "@/types";
import { useThreadContext } from "../contexts/thread-context";
import { deriveThreadTitle, getMessageText } from "../utils/thread-title";

type UseAutoThreadTitleInput = {
  threadId: string;
  messages: Array<{ role: string; content?: unknown }>;
};

export const useAutoThreadTitle = ({
  threadId,
  messages,
}: UseAutoThreadTitleInput) => {
  const { threads, renameThread } = useThreadContext();
  const titledThreadIds = useRef(new Set<string>());
  
  useEffect(() => {
    const currentThreadId = titledThreadIds.current;
    if (currentThreadId.has(threadId)) {
      return;
    }

    const thread = threads.find((item) => item.id === threadId);
    if (thread?.name?.trim()) {
      currentThreadId.add(threadId);
      return;
    }

    const firstUserMessage = messages.find(
      (message) => message.role === Role.USER && getMessageText(message),
    );
    const messageText = firstUserMessage
      ? getMessageText(firstUserMessage)
      : null;

    if (!messageText) {
      return;
    }

    currentThreadId.add(threadId);
    renameThread(threadId, deriveThreadTitle(messageText)).catch((error) => {
      currentThreadId.delete(threadId);
      console.error("Failed to auto-title thread", error);
    });
  }, [messages, renameThread, threadId, threads]);
};

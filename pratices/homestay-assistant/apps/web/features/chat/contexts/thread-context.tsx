"use client";

import { type UseThreadsResult } from "@copilotkit/react-core/v2";
import { createContext, use } from "react";

export const ChatThreadContext = createContext<UseThreadsResult | null>(null);

export const useThreadContext = () => {
  const context = use(ChatThreadContext);
  if (!context) {
    throw new Error("Thread context not found");
  }
  return context;
};

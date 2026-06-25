import type { Thread } from "@copilotkit/react-core/v2";

import { API_ROUTES } from "../constants";

export const fetchThreads = async (
  agentId: string,
  signal?: AbortSignal,
): Promise<Thread[]> => {
  const response = await fetch(API_ROUTES.threads.list(agentId), {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch threads");
  }

  const data = (await response.json()) as { threads: Thread[] };
  return data.threads ?? [];
};

export const createThread = async (
  agentId: string,
  title?: string,
): Promise<Thread> => {
  const response = await fetch(API_ROUTES.threads.root, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId, title }),
  });

  if (!response.ok) {
    throw new Error("Failed to create thread");
  }

  return (await response.json()) as Thread;
};

export const renameThread = async (
  threadId: string,
  agentId: string,
  name: string,
): Promise<Thread> => {
  const response = await fetch(API_ROUTES.threads.byId(threadId), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, agentId }),
  });

  if (!response.ok) {
    throw new Error("Failed to rename thread");
  }

  return (await response.json()) as Thread;
};

export const fetchThreadMessages = async <TMessage>(
  threadId: string,
  agentId: string,
  signal?: AbortSignal,
): Promise<TMessage[]> => {
  const response = await fetch(
    API_ROUTES.threads.messages(threadId, agentId),
    { cache: "no-store", signal },
  );

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as { messages?: TMessage[] };
  return data.messages ?? [];
};

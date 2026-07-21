import type { ChatThread } from "@/features/assistant-ui/types";
import type { Thread } from "@/features/threads/types";

const toDate = (value: string | undefined): Date | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

/** Maps persisted Mastra/API thread shape into the UI Thread model. */
export const mapChatThreadToThread = (thread: ChatThread): Thread => {
  const createdAt = toDate(thread.createdAt) ?? new Date();
  const updatedAt = toDate(thread.updatedAt) ?? createdAt;
  const lastRunAt = toDate(thread.lastRunAt);

  return {
    id: thread.id,
    title: thread.name?.trim() || "New chat",
    createdAt,
    updatedAt,
    status: thread.archived ? "archived" : "active",
    messageCount: thread.messageCount,
    agentId: thread.agentId,
    ...(lastRunAt ? { lastRunAt } : {}),
  };
};

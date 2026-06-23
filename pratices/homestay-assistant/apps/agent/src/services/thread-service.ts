import type { Message } from "@ag-ui/client";
import type { MastraDBMessage } from "@mastra/core/agent";

import { Role } from "@/types";
import { AGENT_KEYS } from "@repo/constants";
import { getThreadResourceId } from "@repo/utils";
import { mastra } from "../mastra/runtime";

export type ThreadSummary = {
  id: string;
  agentId: string;
  name: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

const getHomestayMemory = async () => {
  const agent = mastra.getAgent(AGENT_KEYS.HOMESTAY_ASSISTANT);
  const memory = await agent.getMemory();

  if (!memory) {
    throw new Error("Homestay agent memory is not configured");
  }

  return memory;
};

const toThreadSummary = (
  thread: {
    id: string;
    title?: string;
    createdAt: Date;
    updatedAt: Date;
    metadata?: Record<string, unknown>;
  },
  agentId: string,
): ThreadSummary => {
  const metadataName =
    typeof thread.metadata?.threadTitle === "string"
      ? thread.metadata.threadTitle.trim()
      : undefined;
  const title = thread.title?.trim() || metadataName || null;

  return {
    id: thread.id,
    agentId,
    name: title,
    archived: false,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
  };
};

const getThreadResourceIdForUser = (userId: string, agentId: string) =>
  getThreadResourceId(userId, agentId);

const assertThreadAccess = async (
  threadId: string,
  userId: string,
  agentId: string,
) => {
  const memory = await getHomestayMemory();
  const resourceId = getThreadResourceIdForUser(userId, agentId);
  const existing = await memory.getThreadById({ threadId });

  if (!existing || existing.resourceId !== resourceId) {
    throw new Error("Thread not found");
  }

  return { memory, existing };
};

const mastraMessageToAgUiMessage = (message: MastraDBMessage): Message | null => {
  if (message.role !== Role.USER && message.role !== Role.ASSISTANT) {
    return null;
  }

  const textParts = message.content.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();

  if (!textParts) {
    return null;
  }

  return {
    id: message.id,
    role: message.role,
    content: textParts,
  };
};

export const listThreads = async (
  userId: string,
  agentId: string,
): Promise<ThreadSummary[]> => {
  const memory = await getHomestayMemory();
  const resourceId = getThreadResourceIdForUser(userId, agentId);
  const result = await memory.listThreads({
    filter: { resourceId },
    perPage: false,
    orderBy: { field: "updatedAt", direction: "DESC" },
  });

  return result.threads.map((thread) => toThreadSummary(thread, agentId));
};

export const createThread = async (
  userId: string,
  agentId: string,
  title?: string,
): Promise<ThreadSummary> => {
  const memory = await getHomestayMemory();
  const resourceId = getThreadResourceIdForUser(userId, agentId);
  const thread = await memory.createThread({
    resourceId,
    title,
    metadata: { agentId },
  });

  return toThreadSummary(thread, agentId);
};

export const renameThread = async (
  threadId: string,
  userId: string,
  agentId: string,
  name: string,
): Promise<ThreadSummary> => {
  const { memory, existing } = await assertThreadAccess(threadId, userId, agentId);

  const updated = await memory.updateThread({
    id: threadId,
    title: name,
    metadata: existing.metadata ?? {},
  });

  return toThreadSummary(updated, agentId);
};

export const getThreadMessages = async (
  threadId: string,
  userId: string,
  agentId: string,
): Promise<Message[]> => {
  const { memory } = await assertThreadAccess(threadId, userId, agentId);
  const result = await memory.recall({
    threadId,
    perPage: false,
    orderBy: { field: "createdAt", direction: "ASC" },
  });

  return result.messages
    .map((message) => mastraMessageToAgUiMessage(message))
    .filter((message): message is Message => message !== null);
};

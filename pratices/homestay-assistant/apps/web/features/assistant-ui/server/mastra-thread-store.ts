import path from "node:path";
import Database from "better-sqlite3";

import { getAgentResourceId, parseAgentResourceId } from "@repo/utils";
import type { ChatMessage, ChatThread } from "@/features/assistant-ui/types";

type MastraThreadRow = {
  id: string;
  resourceId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastRunAt: string | null;
  firstUserContent: string | null;
};

type MastraMessageRow = {
  id: string;
  role: string;
  content: string;
};

type MastraThreadIdRow = {
  id: string;
};

type MastraMessagePart = {
  type?: string;
  text?: unknown;
  toolInvocation?: {
    toolCallId?: string;
    toolName?: string;
    args?: unknown;
  };
};

type MastraMessageContent = {
  content?: unknown;
  parts?: MastraMessagePart[];
};

type ChatToolCall = NonNullable<ChatMessage["toolCalls"]>[number];

const getDatabasePath = () =>
  process.env.MASTRA_DB_PATH ??
  path.resolve(process.cwd(), "../agent/mastra.db");

const getDatabase = (readonly = true) =>
  new Database(getDatabasePath(), { readonly });

const toToolCallArguments = (args: unknown) => {
  if (typeof args === "string") {
    return args;
  }

  if (args === undefined || args === null) {
    return "{}";
  }

  try {
    return JSON.stringify(args);
  } catch {
    return "{}";
  }
};

const readMessageText = (parsed: MastraMessageContent, rawContent: string) => {
  const partsText = parsed.parts
    ?.filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text as string)
    .join("")
    .trim();

  if (partsText) {
    return partsText;
  }

  if (typeof parsed.content === "string" && parsed.content.trim()) {
    return parsed.content;
  }

  // Raw non-JSON strings are plain text; JSON blobs without text parts are empty.
  if (rawContent.trim().startsWith("{")) {
    return "";
  }

  return rawContent;
};

const readToolCalls = (parsed: MastraMessageContent): ChatToolCall[] => {
  const seen = new Set<string>();
  const toolCalls: ChatToolCall[] = [];

  for (const part of parsed.parts ?? []) {
    if (part.type !== "tool-invocation" || !part.toolInvocation) {
      continue;
    }

    const { toolCallId, toolName, args } = part.toolInvocation;

    if (!toolCallId || !toolName || seen.has(toolCallId)) {
      continue;
    }

    seen.add(toolCallId);
    toolCalls.push({
      id: toolCallId,
      type: "function",
      function: {
        name: toolName,
        arguments: toToolCallArguments(args),
      },
    });
  }

  return toolCalls;
};

const readStoredMessage = (row: MastraMessageRow): ChatMessage => {
  try {
    const parsed = JSON.parse(row.content) as MastraMessageContent;
    const toolCalls = readToolCalls(parsed);
    const content = readMessageText(parsed, row.content);

    return {
      id: row.id,
      role: row.role as ChatMessage["role"],
      content,
      ...(toolCalls.length > 0 ? { toolCalls } : {}),
    };
  } catch {
    return {
      id: row.id,
      role: row.role as ChatMessage["role"],
      content: row.content,
    };
  }
};

const getThreadName = (row: MastraThreadRow) => {
  const title = row.title.trim();
  const fallbackTitle = row.firstUserContent
    ? readStoredMessage({
        id: "preview",
        role: "user",
        content: row.firstUserContent,
      }).content.trim()
    : "";

  return title || fallbackTitle || "New chat";
};

/**
 * CopilotKit SuggestionEngine sets threadId to a fresh UUID per reload.
 * When those runs used a memory-backed agent, they left ghost threads whose
 * first user message is the injected suggest prompt — hide them from the UI.
 */
const isSuggestionGenerationThread = (firstUserContent: string | null) => {
  if (!firstUserContent) {
    return false;
  }

  const content = readStoredMessage({
    id: "preview",
    role: "user",
    content: firstUserContent,
  }).content;

  return (
    content.includes("copilotkitSuggest") ||
    content.startsWith("Suggest what the user could say next.")
  );
};

export const listMastraThreads = ({
  userId,
  agentId,
}: {
  userId: string;
  agentId: string;
}): ChatThread[] => {
  const resourceId = getAgentResourceId(userId, agentId);
  const database = getDatabase();

  try {
    const rows = database
      .prepare<
        [string],
        MastraThreadRow
      >(
        `
          SELECT
            threads.id,
            threads.resourceId,
            threads.title,
            threads.createdAt,
            threads.updatedAt,
            COUNT(messages.id) AS messageCount,
            MAX(messages.createdAt) AS lastRunAt,
            (
              SELECT firstUserMessage.content
              FROM mastra_messages firstUserMessage
              WHERE firstUserMessage.thread_id = threads.id
                AND firstUserMessage.role = 'user'
              ORDER BY firstUserMessage.createdAt ASC
              LIMIT 1
            ) AS firstUserContent
          FROM mastra_threads threads
          LEFT JOIN mastra_messages messages
            ON messages.thread_id = threads.id
          WHERE threads.resourceId = ?
          GROUP BY threads.id
          ORDER BY COALESCE(lastRunAt, threads.updatedAt, threads.createdAt) DESC
        `,
      )
      .all(resourceId);

    return rows
      .filter((row) => !isSuggestionGenerationThread(row.firstUserContent))
      .map((row) => ({
        id: row.id,
        agentId: parseAgentResourceId(row.resourceId).agentId || agentId,
        name: getThreadName(row),
        archived: false,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        ...(row.lastRunAt ? { lastRunAt: row.lastRunAt } : {}),
        messageCount: row.messageCount,
      }))
      .filter(
        (thread, index, allThreads) =>
          allThreads.findIndex((candidate) => candidate.id === thread.id) ===
          index,
      );
  } finally {
    database.close();
  }
};

export const renameMastraThread = ({
  userId,
  agentId,
  threadId,
  name,
}: {
  userId: string;
  agentId: string;
  threadId: string;
  name: string;
}): ChatThread | null => {
  const resourceId = getAgentResourceId(userId, agentId);
  const database = getDatabase(false);
  const trimmedName = name.trim();

  try {
    const existingThread = database
      .prepare<[string, string], MastraThreadIdRow>(
        `
          SELECT id
          FROM mastra_threads
          WHERE id = ?
            AND resourceId = ?
        `,
      )
      .get(threadId, resourceId);

    if (!existingThread) {
      return null;
    }

    database
      .prepare<[string, string, string, string]>(
        `
          UPDATE mastra_threads
          SET title = ?,
              updatedAt = ?
          WHERE id = ?
            AND resourceId = ?
        `,
      )
      .run(trimmedName, new Date().toISOString(), threadId, resourceId);

    const thread = listMastraThreads({ userId, agentId }).find(
      (currentThread) => currentThread.id === threadId,
    );

    return thread ?? null;
  } finally {
    database.close();
  }
};

export const deleteMastraThread = ({
  userId,
  agentId,
  threadId,
}: {
  userId: string;
  agentId: string;
  threadId: string;
}): boolean => {
  const resourceId = getAgentResourceId(userId, agentId);
  const database = getDatabase(false);

  try {
    const deleteThread = database.transaction(() => {
      const existingThread = database
        .prepare<[string, string], MastraThreadIdRow>(
          `
            SELECT id
            FROM mastra_threads
            WHERE id = ?
              AND resourceId = ?
          `,
        )
        .get(threadId, resourceId);

      if (!existingThread) {
        return false;
      }

      database
        .prepare<[string, string]>(
          `
            DELETE FROM mastra_messages
            WHERE thread_id = ?
              AND resourceId = ?
          `,
        )
        .run(threadId, resourceId);

      database
        .prepare<[string, string]>(
          `
            DELETE FROM mastra_threads
            WHERE id = ?
              AND resourceId = ?
          `,
        )
        .run(threadId, resourceId);

      return true;
    });

    return deleteThread();
  } finally {
    database.close();
  }
};

export const listMastraThreadMessages = ({
  userId,
  agentId,
  threadId,
}: {
  userId: string;
  agentId: string;
  threadId: string;
}): ChatMessage[] => {
  const resourceId = getAgentResourceId(userId, agentId);
  const database = getDatabase();

  try {
    const thread = database
      .prepare<[string, string], { id: string }>(
        `
          SELECT id
          FROM mastra_threads
          WHERE id = ?
            AND resourceId = ?
        `,
      )
      .get(threadId, resourceId);

    if (!thread) {
      return [];
    }

    const rows = database
      .prepare<[string, string], MastraMessageRow>(
        `
          SELECT id, role, content
          FROM mastra_messages
          WHERE thread_id = ?
            AND resourceId = ?
            AND role IN ('assistant', 'system', 'tool', 'user')
          ORDER BY createdAt ASC
        `,
      )
      .all(threadId, resourceId);

    return rows.map(readStoredMessage);
  } finally {
    database.close();
  }
};

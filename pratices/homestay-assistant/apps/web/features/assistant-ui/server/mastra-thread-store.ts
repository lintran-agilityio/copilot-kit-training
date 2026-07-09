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

type MastraMessageContent = {
  content?: unknown;
  parts?: Array<{
    type?: string;
    text?: unknown;
  }>;
};

const getDatabasePath = () =>
  process.env.MASTRA_DB_PATH ??
  path.resolve(process.cwd(), "../agent/mastra.db");

const getDatabase = (readonly = true) =>
  new Database(getDatabasePath(), { readonly });

const readMessageContent = (content: string) => {
  try {
    const parsed = JSON.parse(content) as MastraMessageContent;

    if (typeof parsed.content === "string") {
      return parsed.content;
    }

    const text = parsed.parts
      ?.filter((part) => part.type === "text" && typeof part.text === "string")
      .map((part) => part.text)
      .join("");

    return text || "";
  } catch {
    return content;
  }
};

const getThreadName = (row: MastraThreadRow) => {
  const title = row.title.trim();
  const fallbackTitle = row.firstUserContent
    ? readMessageContent(row.firstUserContent).trim()
    : "";

  return title || fallbackTitle || "New chat";
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

    return rows.map((row) => ({
      id: row.id,
      agentId: parseAgentResourceId(row.resourceId).agentId || agentId,
      name: getThreadName(row),
      archived: false,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      ...(row.lastRunAt ? { lastRunAt: row.lastRunAt } : {}),
      messageCount: row.messageCount,
    }));
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

    return rows.map((row) => ({
      id: row.id,
      role: row.role as ChatMessage["role"],
      content: readMessageContent(row.content),
    }));
  } finally {
    database.close();
  }
};

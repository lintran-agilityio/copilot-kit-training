import Database from "better-sqlite3";

import { studioDbPath } from "agent/db-paths";
import { getAgentResourceId, parseAgentResourceId } from "@repo/utils";
import { THREAD_METADATA_BLOCKED_MESSAGE_IDS } from "@repo/constants";
import type { ChatMessage, ChatThread } from "@/features/chat/types";
import { applyBlockedMessageMetadata } from "@/features/chat/utils/blocked-messages";

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

type MastraThreadMetadataRow = {
  id: string;
  /** LibSQL/SQLite may return JSON text, a parsed object, or a MessagePack blob. */
  metadata: unknown;
};

const readBlockedIdsFromRecord = (metadata: Record<string, unknown>) => {
  const blocked = metadata[THREAD_METADATA_BLOCKED_MESSAGE_IDS];

  if (!Array.isArray(blocked)) {
    return [] as string[];
  }

  return blocked.filter((value): value is string => typeof value === "string");
};

/**
 * Mastra often stores thread.metadata as MessagePack BLOBs. better-sqlite3 then
 * returns a Buffer — not a JSON string — so callers must not assume `.trim()`.
 */
const readBlockedMessageIds = (metadataRaw: unknown) => {
  if (metadataRaw == null) {
    return [] as string[];
  }

  if (
    typeof metadataRaw === "object" &&
    !Array.isArray(metadataRaw) &&
    !Buffer.isBuffer(metadataRaw)
  ) {
    return readBlockedIdsFromRecord(metadataRaw as Record<string, unknown>);
  }

  let raw: string | null = null;

  if (typeof metadataRaw === "string") {
    raw = metadataRaw;
  } else if (Buffer.isBuffer(metadataRaw) || metadataRaw instanceof Uint8Array) {
    const asUtf8 = Buffer.from(metadataRaw).toString("utf8").trim();
    // Only treat UTF-8 JSON text; MessagePack blobs are skipped (no blocked ids).
    raw = asUtf8.startsWith("{") || asUtf8.startsWith("[") ? asUtf8 : null;
  }

  if (!raw?.trim()) {
    return [];
  }

  try {
    const metadata = JSON.parse(raw) as Record<string, unknown>;
    return readBlockedIdsFromRecord(metadata);
  } catch {
    return [];
  }
};

type MastraMessagePart = {
  type?: string;
  text?: unknown;
  toolInvocation?: {
    toolCallId?: string;
    toolName?: string;
    args?: unknown;
    state?: unknown;
    result?: unknown;
  };
};

type MastraMessageContent = {
  content?: unknown;
  parts?: MastraMessagePart[];
};

type ChatToolCall = NonNullable<ChatMessage["toolCalls"]>[number];

/** Same SQLite file Mastra Memory writes via agent/db-paths (cwd-relative). */
const getDatabasePath = () => process.env.MASTRA_DB_PATH ?? studioDbPath;

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

const toToolResultContent = (result: unknown) => {
  if (typeof result === "string") {
    return result;
  }

  try {
    return JSON.stringify(result ?? null);
  } catch {
    return "null";
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

/**
 * Mastra stores tool results inside assistant `parts[].toolInvocation`.
 * CopilotKit generative UI expects separate AG-UI `role: "tool"` messages.
 */
const readToolResultMessages = (
  parsed: MastraMessageContent,
): ChatMessage[] => {
  const seen = new Set<string>();
  const results: ChatMessage[] = [];

  for (const part of parsed.parts ?? []) {
    if (part.type !== "tool-invocation" || !part.toolInvocation) {
      continue;
    }

    const { toolCallId, state, result } = part.toolInvocation;

    if (
      !toolCallId ||
      seen.has(toolCallId) ||
      state !== "result" ||
      result === undefined
    ) {
      continue;
    }

    seen.add(toolCallId);
    results.push({
      id: `${toolCallId}:result`,
      role: "tool",
      toolCallId,
      content: toToolResultContent(result),
    });
  }

  return results;
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

/** Assistant/user/system row plus synthetic AG-UI tool-result messages. */
const expandStoredMessages = (row: MastraMessageRow): ChatMessage[] => {
  try {
    const parsed = JSON.parse(row.content) as MastraMessageContent;
    const toolCalls = readToolCalls(parsed);
    const content = readMessageText(parsed, row.content);

    const primary: ChatMessage = {
      id: row.id,
      role: row.role as ChatMessage["role"],
      content,
      ...(toolCalls.length > 0 ? { toolCalls } : {}),
    };

    if (row.role !== "assistant") {
      return [primary];
    }

    return [primary, ...readToolResultMessages(parsed)];
  } catch {
    return [readStoredMessage(row)];
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

/** Keep historical suggestion-generation threads out of the sidebar. */
const isLegacySuggestionThread = (firstUserContent: string | null) => {
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
      .filter((row) => !isLegacySuggestionThread(row.firstUserContent))
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
      .prepare<[string, string], MastraThreadMetadataRow>(
        `
          SELECT id, metadata
          FROM mastra_threads
          WHERE id = ?
            AND resourceId = ?
        `,
      )
      .get(threadId, resourceId);

    if (!thread) {
      return [];
    }

    const blockedMessageIds = readBlockedMessageIds(thread.metadata);

    const rows = database
      .prepare<[string, string], MastraMessageRow>(
        `
          SELECT id, role, content
          FROM mastra_messages
          WHERE thread_id = ?
            AND resourceId = ?
            AND role IN ('assistant', 'system', 'user')
          ORDER BY createdAt ASC
        `,
      )
      .all(threadId, resourceId);

    return applyBlockedMessageMetadata(
      rows.flatMap(expandStoredMessages),
      blockedMessageIds,
    );
  } finally {
    database.close();
  }
};

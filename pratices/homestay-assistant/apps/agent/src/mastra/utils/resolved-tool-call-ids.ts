import type { RequestContext } from "@mastra/core/request-context";
import { AGENT_MEMORY_LAST_MESSAGES } from "@repo/constants";

type StoredToolInvocation = {
  toolCallId?: unknown;
  state?: unknown;
};

type StoredMessage = {
  content?: {
    parts?: Array<{ type?: string; toolInvocation?: StoredToolInvocation }>;
  };
};

type RecallFn = (args: {
  threadId: string;
  resourceId: string;
  perPage?: number | false;
}) => Promise<{ messages?: StoredMessage[] }>;

type MastraAgentLike = {
  getMemory?: (args: { requestContext?: RequestContext }) => Promise<unknown>;
};

const getRecall = (memory: unknown): RecallFn | undefined => {
  if (!memory || typeof memory !== "object" || !("recall" in memory)) {
    return undefined;
  }

  const { recall } = memory as { recall?: unknown };

  return typeof recall === "function" ? (recall as RecallFn) : undefined;
};

export const readResolvedToolCallIds = (messages: StoredMessage[]) => {
  const toolCallIds = new Set<string>();

  for (const message of messages) {
    for (const part of message.content?.parts ?? []) {
      if (part?.type !== "tool-invocation") {
        continue;
      }

      const { toolCallId, state } = part.toolInvocation ?? {};

      // A stored call without its result still needs the incoming result to
      // arrive, so only completed invocations count as owned by memory.
      if (typeof toolCallId === "string" && state === "result") {
        toolCallIds.add(toolCallId);
      }
    }
  }

  return toolCallIds;
};

/**
 * Tool call ids memory already stores with their result, limited to the recall
 * window the model actually sees. Used to drop tool calls the AG-UI transcript
 * replays, which would otherwise be persisted a second time.
 */
export async function loadResolvedToolCallIdsForThread({
  mastraAgent,
  threadId,
  resourceId,
  requestContext,
}: {
  mastraAgent: MastraAgentLike | null | undefined;
  threadId: string;
  resourceId: string | undefined;
  requestContext?: RequestContext;
}) {
  if (!mastraAgent?.getMemory || !resourceId) {
    return new Set<string>();
  }

  try {
    const recall = getRecall(await mastraAgent.getMemory({ requestContext }));

    if (!recall) {
      return new Set<string>();
    }

    // `recall` paginates from the newest message, so this matches the window
    // the agent itself recalls.
    const { messages } = await recall({
      threadId,
      resourceId,
      perPage: AGENT_MEMORY_LAST_MESSAGES,
    });

    return readResolvedToolCallIds(messages ?? []);
  } catch (error) {
    console.warn(
      `[AgUiMessages] Failed to load resolved tool call ids for thread ${threadId}:`,
      error,
    );

    return new Set<string>();
  }
}

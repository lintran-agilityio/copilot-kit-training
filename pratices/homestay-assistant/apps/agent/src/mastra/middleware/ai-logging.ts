import type { InputProcessor } from "@mastra/core/processors";
import type { ToolHooks } from "@mastra/core/tools";
import { AGENT_KEYS } from "@repo/constants";

import {
  getRequestContextRequestId,
  getRequestContextUserId,
} from "@/mastra/utils/request-context";

type ToolExecContext = {
  requestContext?: {
    get?: (key: string) => unknown;
  };
};

const getRequestIdFromToolContext = (context: unknown): string | undefined => {
  const requestContext = (context as ToolExecContext | undefined)?.requestContext;
  if (!requestContext?.get) {
    return undefined;
  }

  const requestId = requestContext.get("requestId");
  return typeof requestId === "string" ? requestId : undefined;
};

/** Logs agent run start with requestId correlation (Phase 3 AI middleware). */
export const agentRequestLoggingProcessor: InputProcessor = {
  id: "agent-request-logging",
  async processInput({ requestContext, messages }) {
    const requestId = getRequestContextRequestId(requestContext);
    const userId = getRequestContextUserId(requestContext);

    console.info(
      JSON.stringify({
        layer: "mastra",
        event: "agent.started",
        agentId: AGENT_KEYS.MANAGE_ASSISTANT,
        requestId,
        userId,
        messageCount: messages.length,
      }),
    );

    return messages;
  },
};

/** Tool lifecycle logging correlated by requestId. */
export const agentToolLoggingHooks: ToolHooks = {
  beforeToolCall: ({ toolName, context }) => {
    console.info(
      JSON.stringify({
        layer: "mastra",
        event: "tool.started",
        agentId: AGENT_KEYS.MANAGE_ASSISTANT,
        toolName,
        requestId: getRequestIdFromToolContext(context),
      }),
    );
  },
  afterToolCall: ({ toolName, context, error }) => {
    console.info(
      JSON.stringify({
        layer: "mastra",
        event: error ? "tool.failed" : "tool.completed",
        agentId: AGENT_KEYS.MANAGE_ASSISTANT,
        toolName,
        requestId: getRequestIdFromToolContext(context),
        status: error ? "error" : "ok",
        error:
          error instanceof Error
            ? error.message
            : error
              ? String(error)
              : undefined,
      }),
    );
  },
};

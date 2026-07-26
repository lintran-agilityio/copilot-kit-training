import {
  MASTRA_RESOURCE_ID_KEY,
  MASTRA_THREAD_ID_KEY,
  RequestContext,
} from "@mastra/core/request-context";
import { AGENT_KEYS } from "@repo/constants";
import { getAgentResourceId } from "@repo/utils";

/** Duck type for reading infra keys from any RequestContext instance. */
export type RequestContextReader = {
  get: (key: string) => unknown;
};

/** Infrastructure-only context shared across agent → tools. Keep small. */
export type AgentRequestContextValues = {
  userId: string;
  requestId: string;
  threadId?: string;
  sessionId?: string;
  [MASTRA_RESOURCE_ID_KEY]: string;
  [MASTRA_THREAD_ID_KEY]?: string;
};

export type CreateAgentRequestContextInput = {
  userId: string;
  requestId?: string;
  threadId?: string;
  sessionId?: string;
  agentId?: string;
};

export const createAgentRequestContext = ({
  userId,
  requestId = crypto.randomUUID(),
  threadId,
  sessionId,
  agentId = AGENT_KEYS.MANAGE_ASSISTANT,
}: CreateAgentRequestContextInput): RequestContext => {
  const resourceId = getAgentResourceId(userId, agentId);
  const requestContext = new RequestContext();

  requestContext.set("userId", userId);
  requestContext.set("requestId", requestId);
  requestContext.set(MASTRA_RESOURCE_ID_KEY, resourceId);

  if (threadId) {
    requestContext.set("threadId", threadId);
    requestContext.set(MASTRA_THREAD_ID_KEY, threadId);
  }

  if (sessionId) {
    requestContext.set("sessionId", sessionId);
  }

  return requestContext;
};

export const getRequestContextUserId = (
  requestContext: RequestContextReader | undefined,
): string | undefined => {
  const userId = requestContext?.get("userId");
  return typeof userId === "string" && userId.length > 0 ? userId : undefined;
};

export const getRequestContextRequestId = (
  requestContext: RequestContextReader | undefined,
): string | undefined => {
  const requestId = requestContext?.get("requestId");
  return typeof requestId === "string" && requestId.length > 0
    ? requestId
    : undefined;
};

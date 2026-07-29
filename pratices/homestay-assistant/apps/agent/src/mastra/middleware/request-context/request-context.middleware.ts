import { randomUUID } from "node:crypto";

import type { ContextWithMastra } from "@mastra/core/server";

import { REQUEST_CONTEXT_KEYS } from "../constants";
import { resolveAgentId } from "../resolve-agent-id";
import type { MastraMiddlewareHandler } from "../middleware.types";

export const populateRequestContext = async (
  context: ContextWithMastra,
): Promise<{ requestId: string; agentId: string }> => {
  const requestContext = context.get("requestContext");
  const requestId = randomUUID();
  const agentId = await resolveAgentId(context.req.raw);

  requestContext.set(REQUEST_CONTEXT_KEYS.REQUEST_ID, requestId);
  requestContext.set(REQUEST_CONTEXT_KEYS.AGENT_ID, agentId);

  return { requestId, agentId };
};

export const requestContextMiddleware: MastraMiddlewareHandler = async (
  context,
  next,
) => {
  await populateRequestContext(context);
  await next();
};

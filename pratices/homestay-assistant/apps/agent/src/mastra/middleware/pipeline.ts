import { randomUUID } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";

import type {
  AgentRequestPipelineResult,
  AgentRequestPipelineSuccess,
  AgentRequestState,
} from "./types";
import { buildAgentRequestContext } from "./build-request-context";
import { extractClerkToken, verifyClerkAuth } from "./verify-clerk-auth";
import { resolveAgentId } from "./resolve-agent-id";

const agentRequestStorage = new AsyncLocalStorage<AgentRequestState>();

type RunAgentRequestPipelineInput = {
  request: Request;
  sessionUserId?: string | null;
  sessionId?: string | null;
};

export const getCurrentAgentRequest = (): AgentRequestState | undefined =>
  agentRequestStorage.getStore();

export const runWithAgentRequest = <T>(
  state: AgentRequestState,
  fn: () => T,
): T => agentRequestStorage.run(state, fn);

export const runAgentRequestPipeline = async ({
  request,
  sessionUserId,
  sessionId,
}: RunAgentRequestPipelineInput): Promise<AgentRequestPipelineResult> => {
  const auth = await verifyClerkAuth({
    clerkToken: extractClerkToken(request),
    sessionUserId,
    sessionId,
  });

  if (!auth) {
    return {
      ok: false,
      status: 401,
      error: "Authentication required",
    };
  }

  const agentId = await resolveAgentId(request);
  const requestId = randomUUID();
  const requestContext = buildAgentRequestContext({
    auth,
    requestId,
    agentId,
  });

  return {
    ok: true,
    auth,
    requestId,
    agentId,
    requestContext,
  };
};

export const toAgentRequestState = (
  result: AgentRequestPipelineSuccess,
): AgentRequestState => ({
  auth: result.auth,
  requestId: result.requestId,
  agentId: result.agentId,
  requestContext: result.requestContext,
});

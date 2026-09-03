import { randomUUID } from "node:crypto";

import { RequestContext } from "@mastra/core/request-context";
import { AGENT_KEYS } from "@repo/constants";
import { getAgentResourceId } from "@repo/utils";

import type { MastraAuthContext } from "../../src/mastra/middleware/authentication/authentication.types";
import { REQUEST_CONTEXT_KEYS } from "../../src/mastra/middleware/constants";
import { runWithAgentRequest } from "../../src/mastra/middleware/request-pipeline/agent-request-als";
// `runtime.ts` is the same Mastra instance apps/web's CopilotKit route uses
// (`getCopilotkitAgents` in src/copilotkit.ts) — evaluating this instance,
// not the Studio one in `mastra/index.ts`, is what makes these evals
// faithful to production behavior (same tools, prompts, processors,
// step-machine) without going through AG-UI/CopilotKit transport at all.
import { mastra } from "../../src/mastra/runtime";

import { HITL_CLIENT_TOOLS } from "./client-tools";
import { EVAL_USER_ID } from "./fixtures";

export const getHomestayAgent = () => {
  const agent = mastra.getAgent(AGENT_KEYS.HOMESTAY_ASSISTANT);
  if (!agent) {
    throw new Error(
      `Agent "${AGENT_KEYS.HOMESTAY_ASSISTANT}" is not registered on the runtime Mastra instance — check apps/agent/src/mastra/runtime.ts`,
    );
  }
  return agent;
};

const buildFakeAuth = (userId: string): MastraAuthContext => ({
  userId,
  clerkToken: `eval-fake-jwt-${userId}`,
});

export type AgentTurnOptions = {
  /** Reuse a thread id to simulate a multi-turn conversation; defaults to a fresh thread per call. */
  threadId?: string;
  userId?: string;
};

/**
 * Runs one user message through the real homestay agent — real system
 * prompt, real tools, real input/output processors, real booking
 * step-machine. Only the outbound HTTP calls to apps/api are faked (see
 * `fake-api.ts`); callers must have `installFakeApi()` active first.
 *
 * Auth is set both on the `requestContext` passed to `generate()` and via
 * `runWithAgentRequest` (AsyncLocalStorage) because
 * `services/common.ts::resolveAuthForApi` checks the former first and falls
 * back to the latter — mirroring how the request-pipeline middleware
 * populates both in production, without going through that middleware.
 */
export const runAgentTurn = async (
  message: string,
  options: AgentTurnOptions = {},
) => {
  const userId = options.userId ?? EVAL_USER_ID;
  const threadId = options.threadId ?? `eval-${randomUUID()}`;
  const resourceId = getAgentResourceId(userId, AGENT_KEYS.HOMESTAY_ASSISTANT);

  const auth = buildFakeAuth(userId);
  const requestContext = new RequestContext();
  requestContext.set(REQUEST_CONTEXT_KEYS.AUTH, auth);

  const agent = getHomestayAgent();

  const result = await runWithAgentRequest({ auth, requestContext }, () =>
    agent.generate(message, {
      memory: { thread: threadId, resource: resourceId },
      requestContext,
      // See client-tools.ts — without these, the HITL confirm tools AG-UI
      // normally injects don't exist in this context, and the booking
      // step-machine's forced transition to them has nothing to call.
      clientTools: HITL_CLIENT_TOOLS,
    }),
  );

  return { result, threadId, resourceId };
};

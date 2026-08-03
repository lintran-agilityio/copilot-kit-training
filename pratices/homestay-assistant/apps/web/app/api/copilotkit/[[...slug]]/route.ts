import { auth } from "@clerk/nextjs/server";

import {
  CopilotKitIntelligence,
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";

import { getCopilotkitAgents } from "agent/copilotkit";
import {
  getCurrentAgentRequest,
  runAgentRequestPipeline,
  runWithAgentRequest,
  toAgentRequestState,
} from "agent/middleware";

export const runtime = "nodejs";

const basePath = "/api/copilotkit";

const intelligenceApiUrl = process.env.INTELLIGENCE_API_URL;
const intelligenceWsUrl = process.env.INTELLIGENCE_GATEWAY_WS_URL;
const intelligenceApiKey = process.env.INTELLIGENCE_API_KEY;

if (!intelligenceApiUrl || !intelligenceWsUrl || !intelligenceApiKey) {
  throw new Error(
    "Missing CopilotKit Intelligence env: INTELLIGENCE_API_URL, INTELLIGENCE_GATEWAY_WS_URL, INTELLIGENCE_API_KEY",
  );
}

const intelligence = new CopilotKitIntelligence({
  apiUrl: intelligenceApiUrl,
  wsUrl: intelligenceWsUrl,
  apiKey: intelligenceApiKey,
});

const copilotRuntime = new CopilotRuntime({
  agents: async () => {
    const agentRequest = getCurrentAgentRequest();

    if (!agentRequest) {
      return {};
    }

    return getCopilotkitAgents({
      userId: agentRequest.auth.userId,
      agentId: agentRequest.agentId,
      requestContext: agentRequest.requestContext,
    });
  },
  intelligence,
  identifyUser: () => {
    const agentRequest = getCurrentAgentRequest();

    if (!agentRequest?.auth.userId) {
      throw new Error("Authenticated user required for Intelligence threads");
    }

    return {
      id: agentRequest.auth.userId,
      name: agentRequest.auth.userId,
    };
  },
  generateThreadNames: true,
});

// REST (multi-route) is required for Intelligence threads:
// single-route /info always sets threadEndpointsEnabled=false.
const multiRouteHandler = createCopilotRuntimeHandler({
  runtime: copilotRuntime,
  basePath,
});

const dispatchCopilotRequest = (req: Request) => multiRouteHandler(req);

const handler = async (req: Request) => {
  const { userId, sessionId } = await auth();

  const pipeline = await runAgentRequestPipeline({
    request: req,
    sessionUserId: userId,
    sessionId,
  });

  if (!pipeline.ok) {
    return Response.json({ error: pipeline.error }, { status: pipeline.status });
  }

  return runWithAgentRequest(toAgentRequestState(pipeline), () =>
    dispatchCopilotRequest(req),
  );
};

export const GET = handler;

export const POST = handler;

export const PATCH = handler;

export const DELETE = handler;

export const OPTIONS = handler;

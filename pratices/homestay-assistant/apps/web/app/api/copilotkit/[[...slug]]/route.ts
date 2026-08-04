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

const createRuntime = () => {
  const apiUrl = process.env.INTELLIGENCE_API_URL;
  const wsUrl = process.env.INTELLIGENCE_GATEWAY_WS_URL;
  const apiKey = process.env.INTELLIGENCE_API_KEY;
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("INTELLIGENCE_API_URL:", apiUrl);
  console.log("INTELLIGENCE_GATEWAY_WS_URL:", wsUrl);
  console.log("INTELLIGENCE_API_KEY:", apiKey);

  if (!apiUrl || !wsUrl || !apiKey) {
    throw new Error(
      "Missing CopilotKit Intelligence env"
    );
  }

  const intelligence = new CopilotKitIntelligence({
    apiUrl,
    wsUrl,
    apiKey,
  });

  return new CopilotRuntime({
    intelligence,
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
}


const handler = async (req: Request) => {
  const { userId, sessionId } = await auth();

  const pipeline = await runAgentRequestPipeline({
    request: req,
    sessionUserId: userId,
    sessionId,
  });

  if (!pipeline.ok) {
    return Response.json(
      { error: pipeline.error },
      { status: pipeline.status },
    );
  }

  // Create runtime per request
  const runtime = createRuntime();

  // Create CopilotKit handler
  const dispatchCopilotRequest = createCopilotRuntimeHandler({
    runtime,
    basePath,
  });

  return runWithAgentRequest(toAgentRequestState(pipeline), () =>
    dispatchCopilotRequest(req),
  );
};

export const GET = handler;

export const POST = handler;

export const PATCH = handler;

export const DELETE = handler;

export const OPTIONS = handler;

import { auth } from "@clerk/nextjs/server";

import {
  CopilotKitIntelligence,
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";

import { getCopilotkitAgents, latchThreadStop } from "agent/copilotkit";
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

// Singleton: the Intelligence runtime's runner tracks in-flight runs in an
// in-memory Map keyed by threadId. Rebuilding the runtime per request gives
// every request (including the later "stop" request) its own empty runner,
// so Stop can never find the run it's supposed to cancel — the server keeps
// generating and the client just reconnects to the still-running stream.
let copilotRuntimeInstance: ReturnType<typeof createRuntime> | undefined;

const getCopilotRuntime = () => {
  copilotRuntimeInstance ??= createRuntime();
  return copilotRuntimeInstance;
};

/**
 * Thread id of a `POST /agent/{agentId}/stop/{threadId}` request.
 *
 * The runner only reaches `agent.abortRun()` when a run is registered for the
 * thread. A visible generation is a chain of runs, so Stop frequently lands in
 * the gap between two of them and aborts nothing — the thread must be latched
 * from the request itself so the next run in the chain cannot continue.
 */
const stoppedThreadIdFromRequest = (req: Request): string | undefined => {
  if (req.method !== "POST") {
    return undefined;
  }

  const segments = new URL(req.url).pathname.split("/").filter(Boolean);
  const stopIndex = segments.lastIndexOf("stop");

  if (stopIndex < 0 || segments[stopIndex - 2] !== "agent") {
    return undefined;
  }

  const threadId = segments[stopIndex + 1];

  return threadId ? decodeURIComponent(threadId) : undefined;
};

const handler = async (req: Request) => {
  const stoppedThreadId = stoppedThreadIdFromRequest(req);

  if (stoppedThreadId) {
    latchThreadStop(stoppedThreadId);
  }

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

  const dispatchCopilotRequest = createCopilotRuntimeHandler({
    runtime: getCopilotRuntime(),
    basePath,
  });

  return await runWithAgentRequest(toAgentRequestState(pipeline), () =>
    dispatchCopilotRequest(req),
  );
};

export const GET = handler;

export const POST = handler;

export const PATCH = handler;

export const DELETE = handler;

export const OPTIONS = handler;

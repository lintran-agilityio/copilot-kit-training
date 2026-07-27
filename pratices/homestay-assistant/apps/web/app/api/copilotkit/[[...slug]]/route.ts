import { auth } from "@clerk/nextjs/server";
import { MastraClient } from "@mastra/client-js";
import { MastraAgent } from "@ag-ui/mastra";
import {
  CopilotRuntime,
  InMemoryAgentRunner,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { AGENT_KEYS } from "@repo/constants";
import { getAgentResourceId } from "@repo/utils";

import { getMastraUrl } from "@/utils/urls";

export const runtime = "nodejs";

const basePath = "/api/copilotkit";
const MAX_CACHED_USERS = 32;

const unauthorized = () =>
  Response.json({ error: "Unauthorized" }, { status: 401 });

const sharedRunner = new InMemoryAgentRunner();

const optionsHandler = createCopilotRuntimeHandler({
  runtime: new CopilotRuntime({
    agents: async () => ({}),
    runner: sharedRunner,
  }),
  basePath,
});

type RuntimeHandlers = {
  multiRouteHandler: (req: Request) => Promise<Response> | Response;
  singleRouteHandler: (req: Request) => Promise<Response> | Response;
};

const runtimeHandlersByUser = new Map<string, RuntimeHandlers>();

const getRuntimeHandlers = (userId: string): RuntimeHandlers => {
  const cached = runtimeHandlersByUser.get(userId);

  if (cached) {
    return cached;
  }

  const resourceId = getAgentResourceId(userId, AGENT_KEYS.MANAGE_ASSISTANT);
  const mastraClient = new MastraClient({ baseUrl: getMastraUrl() });

  const copilotRuntime = new CopilotRuntime({
    agents: async () =>
      MastraAgent.getRemoteAgents({
        mastraClient,
        resourceId,
      }),
    runner: sharedRunner,
  });

  const handlers: RuntimeHandlers = {
    multiRouteHandler: createCopilotRuntimeHandler({
      runtime: copilotRuntime,
      basePath,
    }),
    singleRouteHandler: createCopilotRuntimeHandler({
      runtime: copilotRuntime,
      basePath,
      mode: "single-route",
    }),
  };

  if (runtimeHandlersByUser.size >= MAX_CACHED_USERS) {
    const oldestKey = runtimeHandlersByUser.keys().next().value;

    if (oldestKey) {
      runtimeHandlersByUser.delete(oldestKey);
    }
  }

  runtimeHandlersByUser.set(userId, handlers);

  return handlers;
};

const handler = async (req: Request) => {
  if (req.method === "OPTIONS") {
    return optionsHandler(req);
  }

  const { userId } = await auth();

  if (!userId) {
    return unauthorized();
  }

  const { multiRouteHandler, singleRouteHandler } = getRuntimeHandlers(userId);

  const pathname = new URL(req.url).pathname.replace(/\/$/, "") || "/";

  if (pathname === basePath && req.method === "POST") {
    return singleRouteHandler(req);
  }

  return multiRouteHandler(req);
};

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;

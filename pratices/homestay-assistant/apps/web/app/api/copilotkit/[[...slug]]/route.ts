import { auth } from "@clerk/nextjs/server";
import {
  CopilotRuntime,
  InMemoryAgentRunner,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { getCopilotkitAgents } from "agent/copilotkit";

export const runtime = "nodejs";

const basePath = "/api/copilotkit";

const copilotRuntime = new CopilotRuntime({
  agents: async () => {
    const { userId } = await auth();

    if (!userId) {
      return {};
    }

    return getCopilotkitAgents(userId);
  },
  runner: new InMemoryAgentRunner(),
});

const multiRouteHandler = createCopilotRuntimeHandler({
  runtime: copilotRuntime,
  basePath,
});

const singleRouteHandler = createCopilotRuntimeHandler({
  runtime: copilotRuntime,
  basePath,
  mode: "single-route",
});

const handler = (req: Request) => {
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

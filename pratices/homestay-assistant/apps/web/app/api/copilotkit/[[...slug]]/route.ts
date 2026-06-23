import { auth } from "@clerk/nextjs/server";

import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { getCopilotkitAgents } from "agent/copilotkit";

const basePath = "/api/copilotkit";

const runtime = new CopilotRuntime({
  agents: async () => {
    const { userId } = await auth();

    if (!userId) {
      throw new Response("Unauthorized", { status: 401 });
    }

    return getCopilotkitAgents(userId);
  },
});

const multiRouteHandler = createCopilotRuntimeHandler({
  runtime,
  basePath,
});

const singleRouteHandler = createCopilotRuntimeHandler({
  runtime,
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

import { MASTRA_RESOURCE_ID_KEY } from "@mastra/core/request-context";
import type { ContextWithMastra } from "@mastra/core/server";
import { registerApiRoute } from "@mastra/core/server";
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { MastraAgent } from "@ag-ui/mastra";

import { enableSuggestionToolChoice } from "@/enable-suggestion-tool-choice";

const basePath = "/copilotkit";

const handleCopilotKitRequest = async (context: ContextWithMastra) => {
  const mastra = context.get("mastra");
  const requestContext = context.get("requestContext");
  const resourceId = requestContext.get(MASTRA_RESOURCE_ID_KEY);

  if (typeof resourceId !== "string" || !resourceId.trim()) {
    return context.json({ error: "Resource id required" }, 400);
  }

  const agents = enableSuggestionToolChoice(
    MastraAgent.getLocalAgents({
      mastra,
      resourceId,
      requestContext,
    }),
  );

  const runtime = new CopilotRuntime({ agents });
  const pathname =
    new URL(context.req.raw.url).pathname.replace(/\/$/, "") || "/";
  const useSingleRoute =
    pathname === basePath && context.req.raw.method === "POST";

  const handler = createCopilotRuntimeHandler({
    runtime,
    basePath,
    ...(useSingleRoute ? { mode: "single-route" as const } : {}),
  });

  const headers = new Headers(context.req.raw.headers);
  headers.delete("authorization");

  return handler(new Request(context.req.raw, { headers }));
};

export const copilotKitRoutes = [
  registerApiRoute("/copilotkit", {
    method: "ALL",
    handler: handleCopilotKitRequest,
  }),
  registerApiRoute("/copilotkit/*", {
    method: "ALL",
    handler: handleCopilotKitRequest,
  }),
];

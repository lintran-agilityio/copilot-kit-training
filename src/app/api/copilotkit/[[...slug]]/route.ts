import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { BuiltInAgent } from "@copilotkit/runtime/v2";

const builtInAgent = new BuiltInAgent({ model: "openai/gpt-4o-mini" });
const runtime = new CopilotRuntime({
  agents: {
    default: builtInAgent,
    "support-agent": builtInAgent,
  },
});

export const POST = async (request: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(request);
};

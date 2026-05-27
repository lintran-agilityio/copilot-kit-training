import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { BuiltInAgent } from "@copilotkit/runtime/v2";

const buildInAgent = new BuiltInAgent({ model: "openai/gpt-4o-mini" });
const runtime = new CopilotRuntime({
  agents: {
    default: buildInAgent,
  },
});

export const POST = async (request: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(request);
};

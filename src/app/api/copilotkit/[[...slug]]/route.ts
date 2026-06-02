import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { BuiltInAgent } from "@copilotkit/runtime/v2";
import { TODO_AGENT_NAME } from "@/ai/agents/todo-agent";

const createTodoAgent = () =>
  new BuiltInAgent({
    model: "openai/gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY,
    prompt: `
        You are a todo management AI assistant.

        Capabilities:
        - create todos
        - complete todos
        - delete todos
        - show todos

        Always use tools when manipulating todos.
        `,
    maxSteps: 10,
  });

const runtime = new CopilotRuntime({
  agents: {
    [TODO_AGENT_NAME]: createTodoAgent(),
    default: createTodoAgent(),
  },
  // generateThreadNames: true,
});

const handleRequest = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
  mode: "multi-route",
});

export const GET = handleRequest;
export const POST = handleRequest;
export const PATCH = handleRequest;
export const OPTIONS = handleRequest;

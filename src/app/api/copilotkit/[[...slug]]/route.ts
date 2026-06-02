import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
  BuiltInAgent,
} from "@copilotkit/runtime/v2";
import { TODO_AGENT_NAME } from "@/ai/agents/todo-agent";

const createTodoAgent = () =>
  new BuiltInAgent({
    model: "openai/gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY,
    prompt: `
        You are a todo management AI assistant.

        Capabilities:
        - createTodo
        - completeTodo
        - deleteTodo
        - show todos

        Always use tools when manipulating todos.
        When calling completeTodo / assignTodo / deleteTodo:
        - Pass id when available.
        - If id is not known, pass exact text.
        - Never send empty objects for id/text.
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

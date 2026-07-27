import { AsyncLocalStorage } from "node:async_hooks";

type StreamFn = (
  messages: unknown,
  options?: Record<string, unknown>,
) => unknown;

type MastraToolChoice =
  | "auto"
  | "none"
  | "required"
  | { type: "tool"; toolName: string };

type ForwardedToolChoice = {
  type?: string;
  function?: { name?: string };
  toolName?: string;
};

type AgUiMastraAgent = {
  agent?: {
    stream?: StreamFn;
  } | null;
  streamMastraAgent?: (
    input: {
      forwardedProps?: {
        toolChoice?: ForwardedToolChoice;
      };
    },
    callbacks: unknown,
  ) => Promise<unknown>;
  [key: string]: unknown;
};

/**
 * CopilotKit suggestion runs pass toolChoice as OpenAI-style
 * `{ type: "function", function: { name: "copilotkitSuggest" } }` in
 * forwardedProps. @ag-ui/mastra never forwards that into Mastra
 * `agent.stream`, so the model answers the suggestion prompt as chat text.
 *
 * Bridge responsibilities (without mutating the shared Mastra agent.stream):
 * 1. Read forwardedProps.toolChoice
 * 2. Normalize to Mastra `{ type: "tool", toolName }`
 * 3. Inject via AsyncLocalStorage + a Proxy on the AG-UI wrapper's agent
 */
const pendingToolChoice = new AsyncLocalStorage<MastraToolChoice>();
const proxiedAgUiAgents = new WeakSet<object>();

const normalizeToolChoice = (
  toolChoice: ForwardedToolChoice | undefined,
): MastraToolChoice | undefined => {
  if (!toolChoice) {
    return undefined;
  }

  if (toolChoice.type === "tool" && typeof toolChoice.toolName === "string") {
    return { type: "tool", toolName: toolChoice.toolName };
  }

  const toolName = toolChoice.function?.name;
  if (!toolName) {
    return undefined;
  }

  return { type: "tool", toolName };
};

const createAgentProxy = <T extends object>(agent: T): T =>
  new Proxy(agent, {
    get(target, prop, receiver) {
      if (prop === "stream") {
        const stream = Reflect.get(target, prop, receiver) as StreamFn | undefined;
        if (!stream) {
          return stream;
        }

        return ((messages: unknown, options: Record<string, unknown> = {}) => {
          const toolChoice = pendingToolChoice.getStore();
          if (!toolChoice) {
            return stream.call(target, messages, options);
          }

          return stream.call(target, messages, {
            ...options,
            toolChoice,
          });
        }) as StreamFn;
      }

      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function"
        ? (value as (...args: unknown[]) => unknown).bind(target)
        : value;
    },
  });

export const enableSuggestionToolChoice = <T extends Record<string, object>>(
  agents: T,
): T => {
  for (const value of Object.values(agents)) {
    const aguiAgent = value as AgUiMastraAgent;

    if (
      !aguiAgent.streamMastraAgent ||
      !aguiAgent.agent?.stream ||
      proxiedAgUiAgents.has(aguiAgent)
    ) {
      continue;
    }

    proxiedAgUiAgents.add(aguiAgent);
    aguiAgent.agent = createAgentProxy(aguiAgent.agent);

    const originalStreamMastraAgent =
      aguiAgent.streamMastraAgent.bind(aguiAgent);

    aguiAgent.streamMastraAgent = async (input, callbacks) => {
      const toolChoice = normalizeToolChoice(
        input.forwardedProps?.toolChoice,
      );

      if (!toolChoice) {
        return originalStreamMastraAgent(input, callbacks);
      }

      return pendingToolChoice.run(toolChoice, () =>
        originalStreamMastraAgent(input, callbacks),
      );
    };
  }

  return agents;
};

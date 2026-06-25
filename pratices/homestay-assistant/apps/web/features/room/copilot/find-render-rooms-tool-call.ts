import type { useAgent } from "@copilotkit/react-core/v2";
import { TOOL_KEYS } from "@repo/constants";

type AgentMessage = ReturnType<typeof useAgent>["agent"]["messages"][number];

type AssistantMessage = Extract<AgentMessage, { role: "assistant" }>;

const isAssistantMessage = (message: AgentMessage): message is AssistantMessage =>
  message.role === "assistant";

export const findLatestRenderRoomsToolCall = (
  messages: AgentMessage[],
) => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message || !isAssistantMessage(message)) {
      continue;
    }

    const toolCall = message.toolCalls?.find(
      (call) => call.function.name === TOOL_KEYS.RENDER_ROOMS,
    );

    if (toolCall) {
      return toolCall;
    }
  }

  return null;
};

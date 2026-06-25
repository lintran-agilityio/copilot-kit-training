export const PAGE_ONLY_GENERATIVE_TOOLS = new Set(["renderRooms", "room"]);

export const PAGE_ROOMS_THREAD_ID = "__page_rooms__";

export const PAGE_ROOMS_PROMPT_PREFIX = "[page-rooms]";

export const isPageInternalThread = (threadId: string) =>
  threadId.startsWith("__page_");

export const isPageOnlyGenerativeTool = (toolName: string) =>
  PAGE_ONLY_GENERATIVE_TOOLS.has(toolName);

type ToolCall = NonNullable<
  import("@ag-ui/client").AssistantMessage["toolCalls"]
>[number];

export const getChatVisibleToolCalls = (toolCalls?: ToolCall[]) => {
  if (!toolCalls?.length) {
    return [];
  }

  const seen = new Set<string>();

  return toolCalls.filter((toolCall) => {
    if (isPageOnlyGenerativeTool(toolCall.function.name)) {
      return false;
    }

    if (seen.has(toolCall.id)) {
      return false;
    }

    seen.add(toolCall.id);
    return true;
  });
};

export const isHiddenAgentPrompt = (content: string) =>
  content.startsWith(PAGE_ROOMS_PROMPT_PREFIX) ||
  content.startsWith("Load all rooms.") ||
  /^Load rooms for \d{4}-\d{2}-\d{2}\./.test(content);

export const getMessageTextContent = (
  content: string | Array<{ type: string; text?: string }>,
) => {
  if (typeof content === "string") {
    return content;
  }

  return content
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text)
    .join("");
};

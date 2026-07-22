import {
  getBookingCancelDisplayText,
  getBookingModifyDisplayText,
  isBookingCancelPrompt,
  isBookingModifyPrompt,
  TOOL_KEYS,
} from "@repo/constants";
import type { CopilotChatAssistantMessageProps } from "@copilotkit/react-core/v2";

const { ACTION, BOOKING, GET } = TOOL_KEYS;

/** Mastra backend tools — LLM registration keys. */
const MASTRA_BACKEND_TOOL_NAMES = [
  BOOKING.FIND_BY_ID,
  BOOKING.GET,
  BOOKING.CANCEL,
  BOOKING.CREATE_BOOKING,
  BOOKING.UPDATE_BOOKING,
  BOOKING.CHECK_ROOM_AVAILABILITY,
  GET.ROOMS,
  GET.FIND_ROOM,
  BOOKING.GET_ROOM_BY_ID,
] as const;

/** Backend tools rendered in chat via useRenderTool. */
const RENDER_BACKEND_TOOLS = [
  BOOKING.CANCEL,
  BOOKING.CREATE_BOOKING,
  BOOKING.UPDATE_BOOKING,
  BOOKING.GET_ROOM_BY_ID,
  GET.FIND_ROOM,
  BOOKING.CHECK_ROOM_AVAILABILITY,
] as const;

/** Legacy kebab/camel ids — kept so old streams stay hidden from chat. */
const LEGACY_HIDDEN_TOOL_NAMES = [
  "create-booking",
  "check-room-availability",
  "get-room",
  "get-rooms",
  "get-bookings",
  "cancelBooking",
  "createBooking",
  "getRoomById",
  "checkRoomAvailability",
  "findBookingById",
  "getBookings",
  "getRooms",
] as const;

/** Room/data tools and page UI actions - hidden from chat; effects render on the page. */
export const CHAT_HIDDEN_TOOLS = new Set([
  ACTION.UPDATE_ROOM_LIST,
  BOOKING.GET,
  BOOKING.FIND_BY_ID,
  GET.ROOMS,
  ...LEGACY_HIDDEN_TOOL_NAMES,
  ...MASTRA_BACKEND_TOOL_NAMES.filter(
    (name) => !(RENDER_BACKEND_TOOLS as readonly string[]).includes(name),
  ),
]);

export const PAGE_ONLY_GENERATIVE_TOOLS = CHAT_HIDDEN_TOOLS;
export const CHAT_VISIBLE_GENERATIVE_TOOLS = new Set([
  ACTION.CONFIRM_BOOKING,
  ACTION.EDIT_MODIFY_BOOKING,
  ACTION.CONFIRM_MODIFY_BOOKING,
  BOOKING.SHOW_CANCEL_DIALOG_CONFIRM,
  ...RENDER_BACKEND_TOOLS,
]);

export const PAGE_ROOMS_PROMPT_PREFIX = "[page-rooms]";

export const isPageOnlyGenerativeTool = (toolName: string) =>
  PAGE_ONLY_GENERATIVE_TOOLS.has(toolName);

type ToolCall = NonNullable<
  CopilotChatAssistantMessageProps["message"]["toolCalls"]
>[number];

export const getChatVisibleToolCalls = (toolCalls?: ToolCall[]) => {
  if (!toolCalls?.length) {
    return [];
  }

  const seen = new Set<string>();

  return toolCalls.filter((toolCall) => {
    const toolName = toolCall.function?.name;

    if (!toolName || toolCall.function?.arguments === undefined) {
      return false;
    }

    if (isPageOnlyGenerativeTool(toolName)) {
      return false;
    }

    if (!CHAT_VISIBLE_GENERATIVE_TOOLS.has(toolName)) {
      return false;
    }

    if (!toolCall.id || seen.has(toolCall.id)) {
      return false;
    }

    seen.add(toolCall.id);
    return true;
  });
};

/** CopilotKit SuggestionEngine injects this as a user message on a cloned agent. */
export const isSuggestionGenerationPrompt = (content: string) =>
  content.includes("copilotkitSuggest") ||
  content.startsWith("Suggest what the user could say next.");

export const isHiddenAgentPrompt = (content: string) =>
  content.startsWith(PAGE_ROOMS_PROMPT_PREFIX) ||
  content.startsWith("Load all rooms.") ||
  isSuggestionGenerationPrompt(content) ||
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

export const getUserVisibleMessageContent = (content: string) => {
  if (isBookingCancelPrompt(content)) {
    return getBookingCancelDisplayText(content);
  }

  if (isBookingModifyPrompt(content)) {
    return getBookingModifyDisplayText(content);
  }

  return content;
};

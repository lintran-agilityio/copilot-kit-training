import {
  getBookingCancelDisplayText,
  isBookingCancelPrompt,
  TOOL_KEYS,
} from "@repo/constants";
import type { CopilotChatAssistantMessageProps } from "@copilotkit/react-core/v2";

const { ACTION, BOOKING, GET } = TOOL_KEYS;

/** Mastra backend tools — LLM calls these camelCase registration keys, not createTool ids. */
const MASTRA_BACKEND_TOOL_NAMES = [
  "findBookingById",
  "getBookings",
  "cancelBooking",
  "createBooking",
  "checkRoomAvailability",
  "getRooms",
  "getAvailableRooms",
  "getRoomById",
] as const;

/** Room/data tools and page UI actions - hidden from chat; effects render on the page. */
export const CHAT_HIDDEN_TOOLS = new Set([
  ACTION.UPDATE_ROOM_LIST,
  ACTION.NAVIGATE_TO_HOME_PAGE,
  ACTION.SET_ROOM_LIST_LOADING,
  ACTION.SYNC_BOOKING_RESULT,
  ACTION.UPDATE_BOOKINGS_LIST,
  ACTION.SHOW_CANCELLATION_SUCCESS,
  ACTION.SELECT_ROOM_FOR_BOOKING,
  BOOKING.CANCEL,
  BOOKING.CREATE,
  BOOKING.GET,
  BOOKING.FIND_BY_ID,
  BOOKING.CHECK_AVAILABILITY,
  GET.ROOMS,
  GET.AVAILABLE_ROOMS,
  GET.ROOM,
  ...MASTRA_BACKEND_TOOL_NAMES,
]);

export const PAGE_ONLY_GENERATIVE_TOOLS = CHAT_HIDDEN_TOOLS;
export const CHAT_VISIBLE_GENERATIVE_TOOLS = new Set([
  ACTION.RENDER_ROOM_RESULTS_PREVIEW,
  ACTION.SHOW_ROOM_DETAIL,
  ACTION.CONFIRM_BOOKING,
  ACTION.SHOW_BOOKING_UNAVAILABLE,
  ACTION.SHOW_BOOKING_SUCCESS,
  BOOKING.SHOW_CANCEL_DIALOG_CONFIRM,
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

export const getUserVisibleMessageContent = (content: string) => {
  if (isBookingCancelPrompt(content)) {
    return getBookingCancelDisplayText(content);
  }

  return content;
};

import { TOOL_KEYS } from "@repo/constants";

import type { CopilotChatAssistantMessageProps } from "@copilotkit/react-core/v2";

import { BOOKING_CONFIRM_PROMPT_PREFIX } from "@repo/constants";

/** Room/data tools and page UI actions — hidden from chat; effects render on the page. */

export const CHAT_HIDDEN_TOOLS = new Set([
  TOOL_KEYS.ACTION.UPDATE_ROOM_LIST,
  TOOL_KEYS.ACTION.NAVIGATE_TO_HOME_PAGE,
  TOOL_KEYS.ACTION.OPEN_ROOM_DETAIL_DRAWER,
  TOOL_KEYS.ACTION.PICK_ROOM_FOR_DETAIL,
  TOOL_KEYS.ACTION.SYNC_BOOKING_RESULT,
  TOOL_KEYS.ACTION.UPDATE_BOOKINGS_LIST,
  TOOL_KEYS.ACTION.NAVIGATE_TO_BOOKINGS_PAGE,
  TOOL_KEYS.ACTION.SHOW_CANCELLATION_SUCCESS,
  TOOL_KEYS.ACTION.UPDATE_BOOKING_FORM,
  TOOL_KEYS.ACTION.SELECT_ROOM_FOR_BOOKING,
  TOOL_KEYS.BOOKING.CREATE,
  TOOL_KEYS.BOOKING.GET,
  TOOL_KEYS.GET.ROOMS,
  TOOL_KEYS.GET.AVAILABLE_ROOMS,
  TOOL_KEYS.GET.ROOM,
  TOOL_KEYS.GET.ROOM_BY_NAME,
  "getRooms",
  "getAvailableRooms",
  "getRoomById",
  "getRoomByName",
  "getBookings",
  "createBooking",
  "cancelBooking",
  "findBookingByRoom",
  TOOL_KEYS.BOOKING.FIND_BY_ROOM,
  "navigate_to_home_page",
  "navigate_to_bookings_page",
  "update_room_list",
  "update_bookings_list",
  "sync_booking_result",
  "show_cancellation_success",
  "open_room_detail_drawer",
  "pick-room-for-detail",
  "selectRoomForBooking",
  "update_booking_form",
  "show_rooms_page",
  "room",
  "renderRooms",
]);

export const PAGE_ONLY_GENERATIVE_TOOLS = CHAT_HIDDEN_TOOLS;

export const PAGE_ROOMS_THREAD_ID = "__page_rooms__";

export const PAGE_ROOMS_PROMPT_PREFIX = "[page-rooms]";

export const isPageInternalThread = (threadId: string) =>
  threadId.startsWith("__page_");

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

    if (!toolCall.id || seen.has(toolCall.id)) {
      return false;
    }

    seen.add(toolCall.id);
    return true;
  });
};

export const isHiddenAgentPrompt = (content: string) =>
  content.startsWith(PAGE_ROOMS_PROMPT_PREFIX) ||
  content.startsWith(BOOKING_CONFIRM_PROMPT_PREFIX) ||
  content.startsWith("Load all rooms.") ||
  /^Load rooms for \d{4}-\d{2}-\d{2}\./.test(content);

export const getMessageTextContent = (
  content: string | Array<{ type: string; text?: string }>
) => {
  if (typeof content === "string") {
    return content;
  }

  return content
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text)
    .join("");
};

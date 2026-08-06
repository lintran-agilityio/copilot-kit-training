import {
  getBookingCancelDisplayText,
  getBookingFormDisplayText,
  getBookingModifyDisplayText,
  getBookingStayDisplayText,
  isBookingCancelPrompt,
  isBookingFormPrompt,
  isBookingModifyPrompt,
  isBookingStayPrompt,
  PAGE_ROOMS_PROMPT_PREFIX,
  TOOL_KEYS,
} from "@repo/constants";
import { getUiActionPromptDisplayText } from "@repo/utils";

import { getLatestFindRoomToolCallIdInCurrentTurn } from "@/features/room/utils";

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

export const CHAT_VISIBLE_GENERATIVE_TOOLS = new Set([
  ACTION.CONFIRM_BOOKING,
  ACTION.EDIT_MODIFY_BOOKING,
  ACTION.CONFIRM_MODIFY_BOOKING,
  BOOKING.SHOW_CANCEL_DIALOG_CONFIRM,
  ...RENDER_BACKEND_TOOLS,
]);

export { PAGE_ROOMS_PROMPT_PREFIX };

export const isPageOnlyGenerativeTool = (toolName: string) =>
  CHAT_HIDDEN_TOOLS.has(toolName);

/** Minimal tool-call shape shared by chat rendering and text suppression. */
export type ChatVisibleToolCall = {
  id?: string;
  function?: { name?: string; arguments?: unknown };
};

type ChatMessageForToolVisibility = {
  id?: string;
  role?: string;
  toolCalls?: ChatVisibleToolCall[];
};

/**
 * Filters toolCalls for chat rendering (and text-suppression parity).
 * When `messages` is provided, keeps only the latest `find_room` in the
 * current turn (`getCurrentTurn` via `getLatestFindRoomToolCallIdInCurrentTurn`)
 * so continuations that replay find_room with a new toolCallId do not stack
 * duplicate cards.
 */
export const getChatVisibleToolCalls = <T extends ChatVisibleToolCall>(
  toolCalls?: T[],
  messages?: ChatMessageForToolVisibility[],
): T[] => {
  if (!toolCalls?.length) {
    return [];
  }

  const seen = new Set<string>();
  const visible = toolCalls.filter((toolCall) => {
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

  // Soft-book / find continuations can replay find_room with a new toolCallId —
  // keep only the last find_room card in the current turn (or this message).
  const lastFindRoomId =
    getLatestFindRoomToolCallIdInCurrentTurn(messages) ??
    [...visible]
      .reverse()
      .find((toolCall) => toolCall.function?.name === GET.FIND_ROOM)?.id;

  if (!lastFindRoomId) {
    return visible;
  }

  return visible.filter(
    (toolCall) =>
      toolCall.function?.name !== GET.FIND_ROOM || toolCall.id === lastFindRoomId,
  );
};

export const isHiddenAgentPrompt = (content: string) =>
  content.startsWith(PAGE_ROOMS_PROMPT_PREFIX) ||
  content.startsWith("Load all rooms.") ||
  /^Load rooms for \d{4}-\d{2}-\d{2}\./.test(content);

/**
 * Extracts plain text from AG-UI message content.
 * Handles string, text-part arrays, and missing content (common on tool-only turns).
 *
 * @param content - Message content from the agent runtime
 * @returns Concatenated text, or an empty string when content is absent
 */
export const getMessageTextContent = (content?: unknown) => {
  if (typeof content === "string") {
    return content;
  }

  // Streaming / tool-only assistant turns often omit content entirely.
  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .filter((part) => {
      if (!part || typeof part !== "object") {
        return false;
      }

      const candidate = part as { type?: unknown; text?: unknown };
      return candidate.type === "text" && Boolean(candidate.text);
    })
    .map((part) => String((part as { text: string }).text))
    .join("");
};

export const getUserVisibleMessageContent = (content: string) => {
  if (isBookingCancelPrompt(content)) {
    return getBookingCancelDisplayText(content);
  }

  if (isBookingModifyPrompt(content)) {
    return getBookingModifyDisplayText(content);
  }

  if (isBookingFormPrompt(content)) {
    return getBookingFormDisplayText(content);
  }

  if (isBookingStayPrompt(content)) {
    return getBookingStayDisplayText(content);
  }

  const uiActionLabel = getUiActionPromptDisplayText(content);
  if (uiActionLabel) {
    return uiActionLabel;
  }

  return content;
};

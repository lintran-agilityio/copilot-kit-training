import { TOOL_KEYS } from "@repo/constants";
import { getCurrentTurn } from "@repo/utils";

import { getChatVisibleToolCalls } from "@/features/copilot/config";
import {
  canRenderBookingUnavailableCard,
  isCancelBookingSuccess,
  isCreateBookingSuccess,
  isUpdateBookingSuccess,
} from "@/features/booking/utils";

const { BOOKING } = TOOL_KEYS;

/**
 * Mirrors each notice component's own "do I render?" check, so text is only
 * hidden when a card is actually on screen.
 *
 * Visibility of which tool calls count is owned solely by
 * {@link getChatVisibleToolCalls} — do not add a second name allowlist here.
 */
const TOOL_CARD_PREDICATES: Record<string, (result: string) => boolean> = {
  [BOOKING.CREATE_BOOKING]: isCreateBookingSuccess,
  [BOOKING.CANCEL]: isCancelBookingSuccess,
  [BOOKING.UPDATE_BOOKING]: isUpdateBookingSuccess,
  [BOOKING.CHECK_ROOM_AVAILABILITY]: canRenderBookingUnavailableCard,
};

type ChatToolCallLike = {
  id?: string;
  function?: { name?: string; arguments?: unknown };
};

type ChatMessageLike = {
  id: string;
  role?: string;
  content?: unknown;
  toolCallId?: string;
  toolCalls?: ChatToolCallLike[];
};

const findToolResult = (messages: ChatMessageLike[], toolCallId?: string) => {
  if (!toolCallId) {
    return null;
  }

  const toolMessage = messages.find(
    (message) => message.role === "tool" && message.toolCallId === toolCallId,
  );

  return typeof toolMessage?.content === "string" ? toolMessage.content : null;
};

const didRenderCard = (
  messages: ChatMessageLike[],
  toolCall: ChatToolCallLike,
) => {
  const toolName = toolCall.function?.name;
  const predicate = toolName ? TOOL_CARD_PREDICATES[toolName] : undefined;
  if (!predicate) {
    // Visible tools without a full-answer card (e.g. find_room) keep text.
    return false;
  }

  const result = findToolResult(messages, toolCall.id);
  if (!result) {
    // Still streaming, or no result — keep the text rather than show nothing.
    return false;
  }

  return predicate(result);
};

/**
 * The agent must always reply in text, but some cards (booking success,
 * cancellation, update, unavailable stay) already state the whole answer.
 * Hide the duplicate sentence in that case.
 *
 * The follow-up sentence usually streams as its own message, so we walk back
 * through the current turn (`getCurrentTurn` on the prefix through this
 * message). Only the most recent card-bearing tool call decides — otherwise
 * a later reply (e.g. a `find_room` summary offering alternatives) would be
 * swallowed by an earlier card.
 */
export const isSupersededByToolCard = (
  messages: ChatMessageLike[] | undefined,
  messageId: string,
) => {
  if (!messages?.length) {
    return false;
  }

  const index = messages.findIndex((item) => item.id === messageId);
  if (index === -1) {
    return false;
  }

  // Turn containing this message = last user at or before it (prefix scan).
  const turn = getCurrentTurn(messages.slice(0, index + 1));

  for (let cursor = turn.length - 1; cursor >= 0; cursor -= 1) {
    const message = turn[cursor];
    if (!message) {
      continue;
    }

    // A user message means we reached the start of this turn.
    if (message.role === "user") {
      return false;
    }

    // Same filter as chat card rendering (page-only + find_room latest-only).
    const visibleToolCalls = getChatVisibleToolCalls(
      message.toolCalls,
      messages,
    );
    if (!visibleToolCalls.length) {
      continue;
    }

    return visibleToolCalls.some((toolCall) => didRenderCard(messages, toolCall));
  }

  return false;
};

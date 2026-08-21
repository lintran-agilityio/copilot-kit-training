import { MESSAGE_ROLE, TOOL_KEYS, TOOL_PURPOSE } from "@repo/constants";

import type { MessageLike } from "@/features/chat/types";

const TERMINAL_TOOL_NAMES = new Set<string>([
  TOOL_KEYS.BOOKING.CREATE_BOOKING,
  TOOL_KEYS.BOOKING.UPDATE_BOOKING,
  TOOL_KEYS.BOOKING.CANCEL,
]);

const isBookingListToolCall = (toolCall: NonNullable<MessageLike["toolCalls"]>[number]) => {
  const toolName = toolCall.function?.name ?? toolCall.name;
  if (toolName !== TOOL_KEYS.BOOKING.GET) {
    return false;
  }

  const rawArguments = toolCall.function?.arguments;
  if (!rawArguments) {
    return true;
  }

  if (typeof rawArguments === "object") {
    const argumentsValue = rawArguments as { purpose?: string };
    return argumentsValue.purpose !== TOOL_PURPOSE.GET_BOOKINGS.RESOLVE;
  }

  try {
    const argumentsValue = JSON.parse(rawArguments) as { purpose?: string };
    return argumentsValue.purpose !== TOOL_PURPOSE.GET_BOOKINGS.RESOLVE;
  } catch {
    return true;
  }
};

/**
 * Walks backward from the message before `lastMessage` to find the assistant
 * tool call that produced it. Keeps scanning past assistant messages that
 * have tool calls of their own but none matching this result's id — an
 * intervening assistant-with-toolCalls message (duplicate/replay, or a
 * parallel unrelated call) must not short-circuit the search before the true
 * owning message is reached.
 */
const findOwningToolCall = (
  messages: MessageLike[],
  lastMessage: MessageLike,
): NonNullable<MessageLike["toolCalls"]>[number] | null => {
  for (let index = messages.length - 2; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== MESSAGE_ROLE.ASSISTANT || !message.toolCalls?.length) {
      continue;
    }

    const matchingCall = message.toolCalls.find(
      (call) => call.id === lastMessage.toolCallId,
    );
    if (matchingCall) {
      return matchingCall;
    }
  }

  return null;
};

/**
 * True when the transcript's very last message is a resolved tool result that
 * ends the workflow. HITL and lookup results are deliberately excluded:
 * those are intermediate messages followed by another modal or tool call.
 *
 * The matching assistant tool call provides the structural link between the
 * result and the turn, independent of whatever `agent.isRunning` reports.
 */
export const isResolvedTerminalToolResultTurn = (
  messages: MessageLike[] | undefined,
): boolean => {
  if (!messages?.length) {
    return false;
  }

  const lastMessage = messages.at(-1);
  if (
    !lastMessage ||
    lastMessage.role !== MESSAGE_ROLE.TOOL ||
    !lastMessage.toolCallId
  ) {
    return false;
  }

  const matchingCall = findOwningToolCall(messages, lastMessage);
  if (!matchingCall) {
    return false;
  }

  const toolName = matchingCall.function?.name ?? matchingCall.name;
  return Boolean(toolName && TERMINAL_TOOL_NAMES.has(toolName));
};

/** True when a guest-facing get_bookings result is the latest transcript item. */
export const isResolvedBookingListToolResultTurn = (
  messages: MessageLike[] | undefined,
): boolean => {
  if (!messages?.length) {
    return false;
  }

  const lastMessage = messages.at(-1);
  if (
    !lastMessage ||
    lastMessage.role !== MESSAGE_ROLE.TOOL ||
    !lastMessage.toolCallId
  ) {
    return false;
  }

  const matchingCall = findOwningToolCall(messages, lastMessage);
  return Boolean(matchingCall && isBookingListToolCall(matchingCall));
};

/**
 * True when a guest-facing find_room result (Room List) is the latest
 * transcript item. No purpose check needed: a BOOK_RESOLVE / resolve-purpose
 * find_room is always followed by another tool call in the same turn (see
 * step-machine's resolveFindRoomBookTransition), so it can never be the last
 * message when the flow actually continues — only a genuinely terminal
 * guest-facing search ends the transcript here.
 */
export const isResolvedFindRoomToolResultTurn = (
  messages: MessageLike[] | undefined,
): boolean => {
  if (!messages?.length) {
    return false;
  }

  const lastMessage = messages.at(-1);
  if (
    !lastMessage ||
    lastMessage.role !== MESSAGE_ROLE.TOOL ||
    !lastMessage.toolCallId
  ) {
    return false;
  }

  const matchingCall = findOwningToolCall(messages, lastMessage);
  if (!matchingCall) {
    return false;
  }

  const toolName = matchingCall.function?.name ?? matchingCall.name;
  return toolName === TOOL_KEYS.GET.FIND_ROOM;
};

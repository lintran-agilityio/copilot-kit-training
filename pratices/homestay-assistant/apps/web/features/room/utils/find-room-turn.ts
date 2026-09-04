import { TOOL_KEYS } from "@repo/constants";
import { getCurrentTurn } from "@repo/utils";

import type { MessageLike } from "@/features/chatbot/types";
import { hasLaterToolCallInTurn } from "@/features/chatbot/utils";

const FIND_ROOM = TOOL_KEYS.GET.FIND_ROOM;

/**
 * True when this turn already invoked `find_room` (cards render via
 * FindRoomNotice). Used to no-op `update_room_list` so the model cannot
 * double-render the room list after a search.
 *
 * Temporary UI compatibility for duplicate tool emissions / replay — prefer
 * fixing transcript uniqueness in AG-UI (`stream-patch`) or Mastra, then
 * remove this guard.
 */
export const hasFindRoomInCurrentTurn = (
  messages: MessageLike[] | undefined,
): boolean => {
  if (!messages?.length) {
    return false;
  }

  return getCurrentTurn(messages).some((message) =>
    message.toolCalls?.some(
      (toolCall) => toolCall.function?.name === FIND_ROOM,
    ),
  );
};

/**
 * Latest `find_room` toolCallId in the current turn (across all assistant
 * messages). Used to keep a single FindRoomNotice when continuations replay
 * find_room with a new id.
 *
 * Temporary card-dedupe compatibility; phase out when replay stops emitting
 * duplicate find_room tool calls for one turn.
 */
export const getLatestFindRoomToolCallIdInCurrentTurn = (
  messages: MessageLike[] | undefined,
): string | undefined => {
  if (!messages?.length) {
    return undefined;
  }

  let lastId: string | undefined;

  for (const message of getCurrentTurn(messages)) {
    for (const toolCall of message.toolCalls ?? []) {
      if (toolCall.function?.name === FIND_ROOM && toolCall.id) {
        lastId = toolCall.id;
      }
    }
  }

  return lastId;
};

/**
 * True when a tool call is an internal "resolve" lookup rather than a
 * guest-facing answer: either it was called with the resolve purpose, or
 * another tool ran later in the same turn (get_bookings, find_booking_by_id,
 * a picker, a confirm dialog, ...) even if the call forgot to pass purpose.
 * Shared by FindRoomNotice (find_room) and MyBookingsNotice (get_bookings),
 * whose resolve-visibility rules are otherwise identical.
 */
export const shouldSuppressForResolve = <TPurpose>(
  purpose: TPurpose | undefined,
  resolvePurpose: TPurpose,
  messages: MessageLike[] | undefined,
  toolCallId: string | undefined,
) => purpose === resolvePurpose || hasLaterToolCallInTurn(messages, toolCallId);

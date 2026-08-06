import { TOOL_KEYS } from "@repo/constants";

type ToolCallLike = {
  id?: string;
  function?: { name?: string };
};

type MessageLike = {
  role?: string;
  toolCallId?: string;
  toolCalls?: ToolCallLike[];
  content?: unknown;
};

const FIND_ROOM = TOOL_KEYS.GET.FIND_ROOM;

/**
 * Index of the last user message — start of the current agent turn.
 * Falls back to 0 when the transcript has no user message yet.
 */
export const getCurrentTurnStartIndex = (messages: MessageLike[]): number => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "user") {
      return index;
    }
  }

  return 0;
};

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

  const turn = messages.slice(getCurrentTurnStartIndex(messages));

  return turn.some((message) =>
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

  const turn = messages.slice(getCurrentTurnStartIndex(messages));
  let lastId: string | undefined;

  for (const message of turn) {
    for (const toolCall of message.toolCalls ?? []) {
      if (toolCall.function?.name === FIND_ROOM && toolCall.id) {
        lastId = toolCall.id;
      }
    }
  }

  return lastId;
};

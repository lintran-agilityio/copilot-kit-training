import type {
  ProcessInputStepArgs,
  ProcessInputStepResult,
} from "@mastra/core/processors";

import { TOOL_KEYS } from "@repo/constants";
import {
  BOOKING_DRAFT_MODE,
  BOOKING_DRAFT_STATUS,
  type BookingDraft,
} from "@repo/schemas/booking-draft";
import { getBusinessDates } from "@repo/utils/date";
import { getCurrentTurn } from "@repo/utils";

import {
  applyMergeToBookingDraft,
  clearBookingWorkflowDraftState,
  readBookingDraft,
} from "./booking-draft-context.ts";
import { extractCreateBookingUserFields } from "./create-booking-draft.ts";
import { parseBookStayMessage } from "./parse-book-stay.ts";
import { REQUEST_CONTEXT_KEYS } from "../middleware/constants.ts";

export { parseBookStayMessage } from "./parse-book-stay.ts";

type ToolResultLike = {
  toolName?: string;
  input?: unknown;
  output?: unknown;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

const asNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

/**
 * Reads plain text from the latest user message in the current turn.
 */
export const extractLatestUserText = (
  messages: ProcessInputStepArgs["messages"] | undefined,
): string => {
  if (!messages?.length) {
    return "";
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== "user") {
      continue;
    }

    const content = asRecord(message.content);
    let text = "";

    const parts = content?.parts;
    if (Array.isArray(parts)) {
      for (const part of parts) {
        const record = asRecord(part);
        if (record?.type === "text" && typeof record.text === "string") {
          text += `${record.text} `;
        }
      }
    }

    if (!text.trim() && typeof content?.content === "string") {
      text = content.content;
    }

    if (!text.trim() && typeof message.content === "string") {
      text = message.content;
    }

    return text.trim();
  }

  return "";
};

const getLastStepToolResult = (
  steps: ProcessInputStepArgs["steps"],
): ToolResultLike | null => {
  const lastStep = steps.at(-1);
  const lastResult = lastStep?.toolResults.at(-1);
  if (!lastResult) {
    return null;
  }
  return lastResult as ToolResultLike;
};

const turnAlreadyAdvancedPastCreateDraft = (
  messages: ProcessInputStepArgs["messages"] | undefined,
): boolean => {
  const turn = getCurrentTurn(messages ?? []);

  for (const message of turn) {
    if (message?.role === "user") {
      continue;
    }
    const content = asRecord(message?.content);
    const parts = content?.parts;
    if (!Array.isArray(parts)) {
      continue;
    }
    for (const part of parts) {
      const record = asRecord(part);
      const invocation = asRecord(record?.toolInvocation);
      const name = asNonEmptyString(invocation?.toolName);
      if (
        name === TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY ||
        name === TOOL_KEYS.ACTION.BOOKING_DRAFT ||
        name === TOOL_KEYS.ACTION.CONFIRM_BOOKING ||
        name === TOOL_KEYS.BOOKING.CREATE_BOOKING ||
        name === TOOL_KEYS.ACTION.EDIT_MODIFY_BOOKING ||
        name === TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING ||
        name === TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM
      ) {
        return true;
      }
    }
  }

  return false;
};

const forceTool = (
  args: ProcessInputStepArgs,
  toolName: string,
): ProcessInputStepResult | undefined => {
  if (!args.tools?.[toolName]) {
    return undefined;
  }

  return {
    activeTools: [toolName],
    toolChoice: {
      type: "tool",
      toolName,
    },
  };
};

/**
 * Routes CREATE booking from draft completeness — never from prompt wording.
 */
export const resolveCreateBookingDraftRoute = (
  args: ProcessInputStepArgs,
  draft: BookingDraft,
): ProcessInputStepResult | undefined => {
  if (draft.mode !== BOOKING_DRAFT_MODE.CREATE) {
    return undefined;
  }

  if (
    draft.status === BOOKING_DRAFT_STATUS.INCOMPLETE ||
    draft.missingFields.length > 0
  ) {
    return forceTool(args, TOOL_KEYS.ACTION.BOOKING_DRAFT);
  }

  if (
    draft.status === BOOKING_DRAFT_STATUS.READY_FOR_AVAILABILITY ||
    draft.status === BOOKING_DRAFT_STATUS.READY_FOR_CONFIRM
  ) {
    // READY_FOR_CONFIRM is handled by availability→confirm transitions.
    // Only force availability when the stay is complete and not yet confirmed.
    if (draft.status === BOOKING_DRAFT_STATUS.READY_FOR_CONFIRM) {
      return undefined;
    }
    return forceTool(args, TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY);
  }

  return undefined;
};

const mergeRoomFromFindRoom = (
  output: Record<string, unknown>,
): { roomId: string; roomName: string; room?: BookingDraft["room"] } | null => {
  if (!Array.isArray(output.rooms) || output.rooms.length !== 1) {
    return null;
  }

  const room = asRecord(output.rooms[0]);
  const roomId = asNonEmptyString(room?.id);
  const roomName = asNonEmptyString(room?.name);
  if (!roomId || !roomName) {
    return null;
  }

  return {
    roomId,
    roomName,
    room: room as BookingDraft["room"],
  };
};

/**
 * CREATE-only fast path: merge Booking Draft, then force Draft HITL or availability.
 * Does not change MODIFY routing.
 */
export const tryEnforceCreateBookingDraftPath = (
  args: ProcessInputStepArgs,
): ProcessInputStepResult | undefined => {
  const requestContext = args.requestContext;
  if (!requestContext) {
    return undefined;
  }

  // Never steal a MODIFY pin.
  if (requestContext.get(REQUEST_CONTEXT_KEYS.PENDING_MODIFY_CANDIDATE)) {
    return undefined;
  }

  const existing = readBookingDraft(requestContext);
  if (existing?.mode === BOOKING_DRAFT_MODE.MODIFY) {
    return undefined;
  }

  if (turnAlreadyAdvancedPastCreateDraft(args.messages)) {
    return undefined;
  }

  const userText = extractLatestUserText(args.messages);
  const dates = getBusinessDates();
  const extracted = extractCreateBookingUserFields(userText, {
    today: dates.today,
    tomorrow: dates.tomorrow,
    weekendCheckIn: dates.weekendCheckIn,
    weekendCheckOut: dates.weekendCheckOut,
  });

  // [book-stay] submit — complete stay from UI, go availability when valid.
  const bookStay = parseBookStayMessage(userText);
  if (bookStay) {
    const draft = applyMergeToBookingDraft(requestContext, {
      mode: BOOKING_DRAFT_MODE.CREATE,
      user: {
        roomId: bookStay.roomId,
        checkInDate: bookStay.checkInDate,
        checkOutDate: bookStay.checkOutDate,
        guests: bookStay.guests,
      },
      ui: { roomId: bookStay.roomId },
    });
    return resolveCreateBookingDraftRoute(args, draft);
  }

  const lastToolResult = getLastStepToolResult(args.steps);

  // find_room(purpose=book_resolve) + exactly one room → merge + route.
  if (lastToolResult?.toolName === TOOL_KEYS.GET.FIND_ROOM) {
    const output = asRecord(lastToolResult.output);
    if (output?.purpose === "book_resolve") {
      const resolved = mergeRoomFromFindRoom(output);
      if (!resolved) {
        // 0 or many matches — leave room pick / not-found to normal tools.
        return undefined;
      }

      const draft = applyMergeToBookingDraft(requestContext, {
        mode: BOOKING_DRAFT_MODE.CREATE,
        user: extracted.fields,
        ui: {
          roomId: resolved.roomId,
          roomName: resolved.roomName,
        },
        requestedTime: extracted.requestedTime,
        room: resolved.room,
      });

      return resolveCreateBookingDraftRoute(args, draft);
    }
  }

  // Clarification turn: incomplete CREATE draft + new user message → re-merge.
  if (
    existing?.mode === BOOKING_DRAFT_MODE.CREATE &&
    existing.status === BOOKING_DRAFT_STATUS.INCOMPLETE &&
    userText
  ) {
    const draft = applyMergeToBookingDraft(requestContext, {
      mode: BOOKING_DRAFT_MODE.CREATE,
      user: extracted.fields,
      requestedTime: extracted.requestedTime,
    });
    return resolveCreateBookingDraftRoute(args, draft);
  }

  return undefined;
};

/**
 * Applies booking_draft HITL result onto the authoritative CREATE draft.
 */
export const applyBookingDraftHitlResult = (
  args: ProcessInputStepArgs,
  output: unknown,
): void => {
  const result = asRecord(output);
  if (!result) {
    return;
  }

  if (result.confirmed === false) {
    clearBookingWorkflowDraftState(args.requestContext);
    return;
  }

  if (result.confirmed !== true) {
    return;
  }

  const mode =
    result.mode === BOOKING_DRAFT_MODE.MODIFY
      ? BOOKING_DRAFT_MODE.MODIFY
      : BOOKING_DRAFT_MODE.CREATE;

  // Step 4 isolates CREATE routing; ignore MODIFY HITL here.
  if (mode !== BOOKING_DRAFT_MODE.CREATE) {
    return;
  }

  applyMergeToBookingDraft(args.requestContext, {
    mode: BOOKING_DRAFT_MODE.CREATE,
    user: {
      roomId: asNonEmptyString(result.roomId) ?? null,
      checkInDate: asNonEmptyString(result.checkInDate) ?? null,
      checkOutDate: asNonEmptyString(result.checkOutDate) ?? null,
      guests:
        typeof result.guests === "number" && result.guests > 0
          ? result.guests
          : null,
    },
  });
};

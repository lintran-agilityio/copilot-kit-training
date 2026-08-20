import type { ProcessInputStepArgs, ProcessInputStepResult } from "@mastra/core/processors";
import { TOOL_KEYS, TOOL_PURPOSE } from "@repo/constants";
import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import { parseConfirmedStay } from "@/mastra/utils/confirmed-stay";

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== "string") return null;
  try { return asRecord(JSON.parse(value)); } catch { return null; }
};

type ToolResult = { toolName?: string; input?: unknown; output?: unknown };

const FIND_BY_ID_REQUESTED_FIELDS = [
  "requestedCheckInDate",
  "requestedCheckOutDate",
  "requestedGuests",
] as const;

/**
 * MODIFY only: after find_booking_by_id resolves exactly one booking, decide
 * deterministically whether the guest already stated a new value (skip the
 * form, go straight to availability) or not (open edit_modify_booking) —
 * based on which requested* fields the model populated, never on re-reading
 * the guest's phrasing a step later.
 */
const resolveFindByIdTransition = (
  input: Record<string, unknown> | null,
  output: Record<string, unknown>,
) => {
  if (input?.purpose !== TOOL_PURPOSE.FIND_BOOKING_BY_ID.MODIFY) return null;

  const bookings = Array.isArray(output.bookings) ? output.bookings : [];
  if (bookings.length !== 1) return null;

  const hasStatedChange = FIND_BY_ID_REQUESTED_FIELDS.some((field) => {
    const value = input?.[field];
    return value !== undefined && value !== null && value !== "";
  });

  return {
    type: "call" as const,
    toolName: hasStatedChange
      ? TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY
      : TOOL_KEYS.ACTION.EDIT_MODIFY_BOOKING,
  };
};

export const resolveBookingStepTransition = ({ toolName, input, output }: ToolResult) => {
  const result = asRecord(output);
  if (!toolName || !result) return null;
  if (toolName === TOOL_KEYS.BOOKING.FIND_BY_ID) {
    return resolveFindByIdTransition(asRecord(input), result);
  }
  if (toolName === TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY) {
    if (result.nextAction === TOOL_KEYS.ACTION.CONFIRM_BOOKING || result.nextAction === TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING) return { type: "call" as const, toolName: String(result.nextAction) };
    if (result.nextAction === "stop_booking" || result.available !== true || result.guestsWithinCapacity !== true) return { type: "stop" as const };
    const availabilityInput = asRecord(input);
    const isModify = result.flow === "modify" || availabilityInput?.flow === "modify" || typeof availabilityInput?.excludeBookingId === "string";
    return { type: "call" as const, toolName: isModify ? TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING : TOOL_KEYS.ACTION.CONFIRM_BOOKING };
  }
  const followUps: Record<string, string> = {
    [TOOL_KEYS.ACTION.EDIT_MODIFY_BOOKING]: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
    [TOOL_KEYS.ACTION.CONFIRM_BOOKING]: TOOL_KEYS.BOOKING.CREATE_BOOKING,
    [TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING]: TOOL_KEYS.BOOKING.UPDATE_BOOKING,
    [TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM]: TOOL_KEYS.BOOKING.CANCEL,
    [TOOL_KEYS.BOOKING.SHOW_MODIFY_DIALOG_SELECT]: TOOL_KEYS.BOOKING.FIND_BY_ID,
  };
  if (followUps[toolName]) return result.confirmed === true ? { type: "call" as const, toolName: followUps[toolName]! } : { type: "stop" as const };
  if ([TOOL_KEYS.BOOKING.CREATE_BOOKING, TOOL_KEYS.BOOKING.UPDATE_BOOKING, TOOL_KEYS.BOOKING.CANCEL].includes(toolName as never)) return { type: "stop" as const };
  return null;
};

const lastStepResult = (args: ProcessInputStepArgs): ToolResult | null => (args.steps.at(-1)?.toolResults.at(-1) as ToolResult | undefined) ?? null;

const pinConfirmedStay = (args: ProcessInputStepArgs, result: ToolResult) => {
  const stay = parseConfirmedStay(result.output as never);
  if (!stay || !args.requestContext) return;
  const key = result.toolName === TOOL_KEYS.ACTION.EDIT_MODIFY_BOOKING
    ? REQUEST_CONTEXT_KEYS.PENDING_MODIFY_CANDIDATE
    : result.toolName === TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING
      ? REQUEST_CONTEXT_KEYS.PENDING_UPDATE_STAY
      : REQUEST_CONTEXT_KEYS.PENDING_CREATE_STAY;
  args.requestContext.set(key, stay);
};

/**
 * Stated-modify fast path: pins the merged candidate (booking's current stay
 * + whichever requested* fields the model gave find_booking_by_id) plus the
 * true pre-change stay, so check_room_availability's own override logic
 * (resolveCandidateInput) applies them deterministically instead of trusting
 * the model to re-merge/re-type them correctly when it calls that tool.
 */
const pinModifyCandidateFromResolution = (args: ProcessInputStepArgs, result: ToolResult) => {
  if (!args.requestContext) return;
  const output = asRecord(result.output);
  const input = asRecord(result.input);
  const bookings = Array.isArray(output?.bookings) ? (output!.bookings as unknown[]) : [];
  const booking = asRecord(bookings[0]);
  if (!booking) return;

  const room = asRecord(output?.room);
  const roomId = typeof room?.id === "string" ? room.id : typeof booking.roomId === "string" ? booking.roomId : undefined;
  const bookingId = typeof booking.bookingId === "string" ? booking.bookingId : undefined;
  const checkInDate = typeof booking.checkInDate === "string" ? booking.checkInDate : undefined;
  const checkOutDate = typeof booking.checkOutDate === "string" ? booking.checkOutDate : undefined;
  const guests = typeof booking.guests === "number" ? booking.guests : undefined;
  if (!roomId || !bookingId || !checkInDate || !checkOutDate || guests === undefined) return;

  const requestedCheckInDate = typeof input?.requestedCheckInDate === "string" ? input.requestedCheckInDate : undefined;
  const requestedCheckOutDate = typeof input?.requestedCheckOutDate === "string" ? input.requestedCheckOutDate : undefined;
  const requestedGuests = typeof input?.requestedGuests === "number" ? input.requestedGuests : undefined;

  args.requestContext.set(REQUEST_CONTEXT_KEYS.PENDING_MODIFY_CANDIDATE, {
    roomId,
    bookingId,
    checkInDate: requestedCheckInDate ?? checkInDate,
    checkOutDate: requestedCheckOutDate ?? checkOutDate,
    guests: requestedGuests ?? guests,
  });
  args.requestContext.set(REQUEST_CONTEXT_KEYS.PENDING_MODIFY_ORIGINAL, {
    checkInDate,
    checkOutDate,
    guests,
  });
};

/** Pins the picker's chosen booking id so find_booking_by_id prefers it over a possibly-stale model-supplied id. */
const pinModifyBookingId = (args: ProcessInputStepArgs, result: ToolResult) => {
  if (!args.requestContext) return;
  const output = asRecord(result.output);
  const bookingId = typeof output?.bookingId === "string" ? output.bookingId : undefined;
  if (!bookingId) return;
  args.requestContext.set(REQUEST_CONTEXT_KEYS.PENDING_MODIFY_BOOKING_ID, bookingId);
};

export const enforceBookingStep = (args: ProcessInputStepArgs): ProcessInputStepResult | undefined => {
  if (args.abortSignal?.aborted) return { activeTools: [], toolChoice: "none" };

  const result = lastStepResult(args);
  if (!result) return undefined;
  const transition = resolveBookingStepTransition(result);
  if (!transition) return undefined;
  if (transition.type === "stop") return { activeTools: [], toolChoice: "none" };
  if (!args.tools?.[transition.toolName]) return undefined;

  if (result.toolName === TOOL_KEYS.BOOKING.FIND_BY_ID && transition.toolName === TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY) {
    pinModifyCandidateFromResolution(args, result);
  } else if (result.toolName === TOOL_KEYS.BOOKING.SHOW_MODIFY_DIALOG_SELECT && transition.toolName === TOOL_KEYS.BOOKING.FIND_BY_ID) {
    pinModifyBookingId(args, result);
  } else {
    pinConfirmedStay(args, result);
  }

  return {
    activeTools: [transition.toolName],
    toolChoice: { type: "tool", toolName: transition.toolName },
  };
};

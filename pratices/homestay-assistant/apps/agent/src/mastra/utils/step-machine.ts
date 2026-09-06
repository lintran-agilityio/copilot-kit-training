/**
 * Booking step machine.
 *
 * After every tool step the agent takes, `enforceBookingStep` (wired as the
 * agent's `prepareStep`) inspects the last tool result and decides, purely
 * from that result's documented shape, whether to force a specific next tool
 * call or to stop the turn. This keeps the deterministic booking routing
 * (find → availability → confirm → mutate) off the model's judgement.
 *
 * The file is organized in three layers:
 *   1. Transition resolution — `resolveEnforcedTransition` and its per-tool
 *      helpers. Given the last tool result (and, for `find_room`, the chat
 *      messages) they return a {@link Transition}. These are decision-only,
 *      with the single documented exception of `resolveFindRoomBookTransition`
 *      stashing a Booking Form stay hint.
 *   2. Transition side effects — request-context candidate pinning applied
 *      once a forced-tool transition is committed.
 *   3. Enforcement — `enforceBookingStep` ties the two together and emits the
 *      Mastra `forceTool` / `stopToolExecution` envelope.
 */
import type {
  ProcessInputStepArgs,
  ProcessInputStepResult,
} from "@mastra/core/processors";
import { TOOL_KEYS, TOOL_PURPOSE } from "@repo/constants";
import { addDaysYmd } from "@repo/utils";

import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import {
  resolveContinuityStayHint,
  resolveCorroboratedBookFacts,
  stashBookingFormStayHint,
} from "@/mastra/utils/book-form-prefill";
import { parseConfirmedStay } from "@/mastra/utils/confirmed-stay";
import { asRecord, asUnknownRecord } from "@/mastra/utils/json-value";
import {
  forceTool,
  hasTool,
  stopToolExecution,
} from "@/mastra/utils/parse-tool-output";

// --- Types ----------------------------------------------------------------

/**
 * Raw shape of one completed tool step, as it arrives on
 * `args.steps[].toolResults[]`.
 */
export type ToolStepResult = {
  toolName?: string;
  input?: unknown;
  output?: unknown;
};

/**
 * A resolved step-machine decision:
 *   - `call` — force exactly this tool as the next model step. `pin` carries an
 *     optional request-context candidate to stash first (see
 *     {@link applyTransitionSideEffects}).
 *   - `stop` — end the turn now, letting no tool run.
 */
export type Transition =
  | { type: "call"; toolName: string; pin?: unknown }
  | { type: "stop" };

/** The `call` branch of {@link Transition}. */
type ForcedToolTransition = Extract<Transition, { type: "call" }>;

/** Applies request-context state that a committed forced-tool transition implies. */
type TransitionSideEffect = (
  args: ProcessInputStepArgs,
  result: ToolStepResult,
) => void;

/** The last tool result of the most recent step, or `null` when there is none. */
const lastToolStepResult = (
  args: ProcessInputStepArgs,
): ToolStepResult | null =>
  (args.steps.at(-1)?.toolResults.at(-1) as ToolStepResult | undefined) ?? null;

// --- Routing tables ------------------------------------------------------

const FIND_BY_ID_REQUESTED_FIELDS = [
  "requestedCheckInDate",
  "requestedCheckOutDate",
  "requestedGuests",
] as const;

/**
 * Tools that pause for a guest decision, mapped to the tool to force once the
 * guest confirms. A `confirmed:false` result on any of them stops the turn.
 */
const CONFIRMATION_FOLLOW_UPS: Record<string, string> = {
  [TOOL_KEYS.ACTION.EDIT_MODIFY_BOOKING]:
    TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
  [TOOL_KEYS.ACTION.CONFIRM_BOOKING]: TOOL_KEYS.BOOKING.CREATE_BOOKING,
  [TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING]: TOOL_KEYS.BOOKING.UPDATE_BOOKING,
  [TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM]: TOOL_KEYS.BOOKING.CANCEL,
  [TOOL_KEYS.BOOKING.SHOW_MODIFY_DIALOG_SELECT]: TOOL_KEYS.BOOKING.FIND_BY_ID,
};

/** Mutation tools — once one returns, the turn is done. */
const TERMINAL_TOOLS: readonly string[] = [
  TOOL_KEYS.BOOKING.CREATE_BOOKING,
  TOOL_KEYS.BOOKING.UPDATE_BOOKING,
  TOOL_KEYS.BOOKING.CANCEL,
];

// --- Transition resolution: per-tool junctions --------------------------

/**
 * MODIFY only: after find_booking_by_id resolves exactly one booking, decide
 * deterministically whether the guest already stated a new value (skip the
 * form, go straight to availability) or not (open edit_modify_booking) —
 * based on which requested* fields resolved on the OUTPUT (findBookingByIdTool
 * echoes back its own args merged with whatever was pinned from an earlier
 * show_modify_dialog_select pick — see PENDING_MODIFY_REQUESTED_FIELDS),
 * never on this call's raw `input` alone or on re-reading the guest's
 * phrasing a step later.
 */
const resolveFindByIdTransition = (
  input: Record<string, unknown> | null,
  output: Record<string, unknown>,
): Transition | null => {
  if (input?.purpose !== TOOL_PURPOSE.FIND_BOOKING_BY_ID.MODIFY) return null;

  const bookings = Array.isArray(output.bookings) ? output.bookings : [];
  if (bookings.length !== 1) return null;

  const hasStatedChange = FIND_BY_ID_REQUESTED_FIELDS.some((field) => {
    const value = output[field];
    return value !== undefined && value !== null && value !== "";
  });

  return {
    type: "call",
    toolName: hasStatedChange
      ? TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY
      : TOOL_KEYS.ACTION.EDIT_MODIFY_BOOKING,
  };
};

/**
 * CREATE + MODIFY: routes the result of check_room_availability. The tool's own
 * output already encodes the decision (`nextAction`, `available`,
 * `guestsWithinCapacity`, `stayUnchanged` folded into `nextAction`); this only
 * translates it into a forced confirm tool or a stop, picking the create- vs
 * modify-flow confirm tool from `flow` / `excludeBookingId`.
 */
const resolveCheckAvailabilityTransition = (
  input: Record<string, unknown> | null,
  result: Record<string, unknown>,
): Transition | null => {
  const { nextAction, available, guestsWithinCapacity, flow } = result;

  if (
    nextAction === TOOL_KEYS.ACTION.CONFIRM_BOOKING ||
    nextAction === TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING
  ) {
    return { type: "call", toolName: String(nextAction) };
  }

  if (
    nextAction === "stop_booking" ||
    available !== true ||
    guestsWithinCapacity !== true
  ) {
    return { type: "stop" };
  }

  const isModify =
    flow === "modify" ||
    input?.flow === "modify" ||
    typeof input?.excludeBookingId === "string";

  return {
    type: "call",
    toolName: isModify
      ? TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING
      : TOOL_KEYS.ACTION.CONFIRM_BOOKING,
  };
};

/**
 * BOOK only: after find_room(book_resolve) resolves exactly one room, decide
 * deterministically whether the check-in date AND guest count are already
 * known — from this turn's stated values (echoed on the find_room result;
 * see normalizeFindRoomInput/findRoomTool, corroborated against the guest's
 * own latest message via resolveCorroboratedBookFacts — see booking-resolver
 * for why the echoed values alone are not trusted) or from an earlier dated/
 * guest-count find_room this conversation (resolveContinuityStayHint) — so
 * the platform forces exactly ONE of check_room_availability / get_room_by_id
 * as the next call. This is the one BOOK junction that used to rely entirely
 * on prose ("decide from the latest message"), which let the model call both
 * tools in the same step (double UI) or reopen the form despite guests
 * already being known from an earlier turn.
 *
 * Not decision-only: when the stay is not fully known it stashes what it has
 * as a Booking Form stay hint before forcing get_room_by_id.
 */
const resolveFindRoomBookTransition = (
  input: Record<string, unknown> | null,
  output: Record<string, unknown>,
  args: ProcessInputStepArgs,
): Transition | null => {
  if (input?.purpose !== TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE) return null;

  const rooms = Array.isArray(output.rooms) ? output.rooms : [];
  if (rooms.length !== 1) return null;

  const roomRecord = asUnknownRecord(rooms[0]);
  const roomId = typeof roomRecord?.id === "string" ? roomRecord.id : undefined;
  if (!roomId) return null;

  const echoedCheckIn =
    typeof output.date === "string" && output.date ? output.date : undefined;
  const echoedGuests =
    typeof output.guests === "number" && output.guests > 0
      ? output.guests
      : undefined;

  const corroborated = resolveCorroboratedBookFacts({
    messages: args.messages,
    statedCheckIn: echoedCheckIn,
    statedGuests: echoedGuests,
  });
  const statedCheckIn = corroborated.checkInDate;
  const statedGuests = corroborated.guests;

  const continuityHint =
    statedCheckIn && statedGuests
      ? null
      : resolveContinuityStayHint(args.messages);
  const checkInDate = statedCheckIn ?? continuityHint?.checkInDate;
  const guests = statedGuests ?? continuityHint?.guests;

  if (checkInDate && guests) {
    return {
      type: "call",
      toolName: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
      pin: { roomId, checkInDate, guests },
    };
  }

  stashBookingFormStayHint(args.requestContext, {
    ...(checkInDate
      ? { checkInDate, checkOutDate: addDaysYmd(checkInDate, 1) }
      : {}),
    ...(guests ? { guests } : {}),
  });

  return { type: "call", toolName: TOOL_KEYS.BOOKING.GET_ROOM_BY_ID };
};

// --- Transition resolution: entry point ---------------------------------

/**
 * Generic booking-workflow routing — every junction except `find_room`, which
 * additionally depends on the chat messages and is handled in
 * `resolveEnforcedTransition` directly.
 */
const resolveBookingWorkflowTransition = (
  result: ToolStepResult,
): Transition | undefined => {
  const { toolName, input, output } = result;
  const outputRecord = asUnknownRecord(output);
  if (!toolName || !outputRecord) return undefined;

  if (toolName === TOOL_KEYS.BOOKING.FIND_BY_ID) {
    return (
      resolveFindByIdTransition(asUnknownRecord(input), outputRecord) ??
      undefined
    );
  }

  if (toolName === TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY) {
    return (
      resolveCheckAvailabilityTransition(
        asUnknownRecord(input),
        outputRecord,
      ) ?? undefined
    );
  }

  const followUpTool = CONFIRMATION_FOLLOW_UPS[toolName];
  if (followUpTool) {
    return outputRecord.confirmed === true
      ? { type: "call", toolName: followUpTool }
      : { type: "stop" };
  }

  if (TERMINAL_TOOLS.includes(toolName)) return { type: "stop" };

  return undefined;
};

/**
 * Resolves the transition to enforce after the last tool step.
 *
 * Decision-only, save for `resolveFindRoomBookTransition`'s documented stay-hint
 * stash — all request-context candidate pinning happens later in
 * {@link applyTransitionSideEffects}.
 */
export const resolveEnforcedTransition = (
  args: ProcessInputStepArgs,
  result: ToolStepResult,
): Transition | undefined => {
  if (result.toolName === TOOL_KEYS.GET.FIND_ROOM) {
    return (
      resolveFindRoomBookTransition(
        asUnknownRecord(result.input),
        asUnknownRecord(result.output) ?? {},
        args,
      ) ?? undefined
    );
  }

  return resolveBookingWorkflowTransition(result);
};

// --- Transition side effects: request-context pinning -------------------

const pinConfirmedStay = (
  args: ProcessInputStepArgs,
  result: ToolStepResult,
) => {
  const stay = parseConfirmedStay(result.output as never);
  if (!stay || !args.requestContext) return;
  const key =
    result.toolName === TOOL_KEYS.ACTION.EDIT_MODIFY_BOOKING
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
const pinModifyCandidateFromResolution = (
  args: ProcessInputStepArgs,
  result: ToolStepResult,
) => {
  if (!args.requestContext) return;
  const output = asUnknownRecord(result.output);
  const bookings = Array.isArray(output?.bookings)
    ? (output!.bookings as unknown[])
    : [];
  const booking = asUnknownRecord(bookings[0]);
  if (!booking) return;

  const room = asRecord(output?.room);
  const roomId =
    typeof room?.id === "string"
      ? room.id
      : typeof booking.roomId === "string"
        ? booking.roomId
        : undefined;
  const bookingId =
    typeof booking.bookingId === "string" ? booking.bookingId : undefined;
  const checkInDate =
    typeof booking.checkInDate === "string" ? booking.checkInDate : undefined;
  const checkOutDate =
    typeof booking.checkOutDate === "string" ? booking.checkOutDate : undefined;
  const guests =
    typeof booking.guests === "number" ? booking.guests : undefined;
  if (
    !roomId ||
    !bookingId ||
    !checkInDate ||
    !checkOutDate ||
    guests === undefined
  )
    return;

  // Read off the OUTPUT, not this call's raw input — findBookingByIdTool
  // echoes back whichever requested* fields resolved, whether the model set
  // them on this specific call or they were carried over via
  // PENDING_MODIFY_REQUESTED_FIELDS from an earlier show_modify_dialog_select pick.
  const requestedCheckInDate =
    typeof output?.requestedCheckInDate === "string"
      ? output.requestedCheckInDate
      : undefined;
  const requestedCheckOutDate =
    typeof output?.requestedCheckOutDate === "string"
      ? output.requestedCheckOutDate
      : undefined;
  const requestedGuests =
    typeof output?.requestedGuests === "number"
      ? output.requestedGuests
      : undefined;

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

/**
 * Pins the picker's chosen booking id so find_booking_by_id prefers it over a
 * possibly-stale model-supplied id. Also carries forward whichever
 * requested* fields the guest already stated when show_modify_dialog_select
 * was called (its own input, from BEFORE the HITL pause) — so the forced
 * find_booking_by_id call right after confirmed:true doesn't have to
 * re-derive them from a guest message several tool-calls back.
 */
const pinModifyBookingId = (
  args: ProcessInputStepArgs,
  result: ToolStepResult,
) => {
  if (!args.requestContext) return;
  const output = asUnknownRecord(result.output);
  const bookingId =
    typeof output?.bookingId === "string" ? output.bookingId : undefined;
  if (!bookingId) return;
  args.requestContext.set(
    REQUEST_CONTEXT_KEYS.PENDING_MODIFY_BOOKING_ID,
    bookingId,
  );

  const input = asUnknownRecord(result.input);
  const requestedCheckInDate =
    typeof input?.requestedCheckInDate === "string"
      ? input.requestedCheckInDate
      : undefined;
  const requestedCheckOutDate =
    typeof input?.requestedCheckOutDate === "string"
      ? input.requestedCheckOutDate
      : undefined;
  const requestedGuests =
    typeof input?.requestedGuests === "number"
      ? input.requestedGuests
      : undefined;
  if (
    requestedCheckInDate ||
    requestedCheckOutDate ||
    requestedGuests !== undefined
  ) {
    args.requestContext.set(
      REQUEST_CONTEXT_KEYS.PENDING_MODIFY_REQUESTED_FIELDS,
      {
        checkInDate: requestedCheckInDate,
        checkOutDate: requestedCheckOutDate,
        guests: requestedGuests,
      },
    );
  }
};

/**
 * Pins the cancel dialog's confirmed booking id so cancel_booking prefers it
 * over a possibly-stale model-supplied id — the CANCEL analogue of
 * pinModifyBookingId.
 */
const pinCancelBookingId = (
  args: ProcessInputStepArgs,
  result: ToolStepResult,
) => {
  if (!args.requestContext) return;
  const output = asUnknownRecord(result.output);
  const bookingId =
    typeof output?.bookingId === "string" ? output.bookingId : undefined;
  if (!bookingId) return;
  args.requestContext.set(
    REQUEST_CONTEXT_KEYS.PENDING_CANCEL_BOOKING_ID,
    bookingId,
  );
};

/**
 * `from` tool → `to` forced tool → the extra request-context pinning that
 * transition needs. A junction with no rule falls back to {@link pinConfirmedStay}.
 */
const TRANSITION_SIDE_EFFECT_RULES: readonly {
  from: string;
  to: string;
  effect: TransitionSideEffect;
}[] = [
  {
    from: TOOL_KEYS.BOOKING.FIND_BY_ID,
    to: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
    effect: pinModifyCandidateFromResolution,
  },
  {
    from: TOOL_KEYS.BOOKING.SHOW_MODIFY_DIALOG_SELECT,
    to: TOOL_KEYS.BOOKING.FIND_BY_ID,
    effect: pinModifyBookingId,
  },
  {
    from: TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM,
    to: TOOL_KEYS.BOOKING.CANCEL,
    effect: pinCancelBookingId,
  },
];

/**
 * Applies the request-context state a committed forced-tool transition implies.
 *
 * Transition resolution stays (almost) pure; this function owns the
 * request-context mutations / booking-candidate pinning.
 */
const applyTransitionSideEffects = (
  args: ProcessInputStepArgs,
  result: ToolStepResult,
  transition: ForcedToolTransition,
): void => {
  if (transition.pin) {
    args.requestContext?.set(
      REQUEST_CONTEXT_KEYS.PENDING_CREATE_CANDIDATE,
      transition.pin,
    );
  }

  const rule = TRANSITION_SIDE_EFFECT_RULES.find(
    ({ from, to }) => from === result.toolName && to === transition.toolName,
  );

  if (rule) {
    rule.effect(args, result);
    return;
  }

  pinConfirmedStay(args, result);
};

// --- Enforcement -------------------------------------------------------

/**
 * A forced transition silently no-ops when the target tool isn't in
 * `args.tools` — normally because the frontend hasn't mounted the matching
 * `useHumanInTheLoop`/`useRenderTool` registration for this run (see
 * apps/web/features/chatbot/declarative-ui/tools/booking-tools.tsx). That's a real gap:
 * the booking flow just stalls with no forced tool call and no error. Warn
 * so it's visible in logs instead of only showing up as "the agent stopped
 * responding" from the guest's side.
 */
const isForcedToolAvailable = (
  args: ProcessInputStepArgs,
  result: ToolStepResult,
  transition: ForcedToolTransition,
): boolean => {
  if (hasTool(args, transition.toolName)) return true;

  console.warn(
    `[BookingStepMachine] Wanted to force "${transition.toolName}"${result.toolName ? ` after "${result.toolName}"` : ""}, but it isn't registered in this run's tools — is BookingToolsProvider mounted on the frontend? Skipping the forced transition.`,
  );

  return false;
};

/**
 * The agent's `prepareStep` hook: after each tool step, force the next booking
 * step (or stop the turn) per {@link resolveEnforcedTransition}.
 */
export const enforceBookingStep = (
  args: ProcessInputStepArgs,
): ProcessInputStepResult | undefined => {
  if (args.abortSignal?.aborted) {
    return stopToolExecution();
  }

  const result = lastToolStepResult(args);
  if (!result) {
    return undefined;
  }

  const transition = resolveEnforcedTransition(args, result);
  if (!transition) {
    return undefined;
  }

  if (transition.type === "stop") {
    return stopToolExecution();
  }

  if (!isForcedToolAvailable(args, result, transition)) {
    return undefined;
  }

  applyTransitionSideEffects(args, result, transition);

  return forceTool(transition.toolName);
};

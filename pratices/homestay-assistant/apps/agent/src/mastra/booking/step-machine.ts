import type {
  ProcessInputStepArgs,
  ProcessInputStepResult,
} from "@mastra/core/processors";

import { TOOL_KEYS } from "@repo/constants";
import { getCurrentTurn } from "@repo/utils";

import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import {
  asNonEmptyString,
  asRecord,
  parseConfirmedStay,
  type ConfirmedStay,
  type JsonValue,
} from "@/mastra/utils";
import { resolveCancelWithoutBookingIdStep } from "@/mastra/booking/cancel-resolve-fast-path";
import {
  BOOKING_STEP_TRANSITION_TYPE,
  isActionableBookingStepDecision,
} from "@/mastra/constants";
import { resolveListMyBookingsStep } from "@/mastra/booking/list-my-bookings-fast-path";
import { resolveModifyWithoutBookingIdStep } from "@/mastra/booking/modify-resolve-fast-path";
import { modifyNoOpNarrationStep } from "@/mastra/booking/modify-noop-narration-step";
import { resolveBookingFromGetBookingsInTurn } from "@/mastra/booking/resolve-modify-booking";
import { tryEnforceSearchTerminalStep } from "@/mastra/booking/search-terminal-fast-path";
import { tryEnforceStatedModifyFastPath } from "@/mastra/booking/stated-modify-fast-path";
import type {
  CancelBookingByRoomResult,
  ModifyBookingByRoomResult,
} from "@repo/schemas";

type ToolResultLike = {
  toolName?: string;
  input?: JsonValue;
  output?: JsonValue;
};

export type BookingStepTransition =
  | { type: typeof BOOKING_STEP_TRANSITION_TYPE.CALL; toolName: string }
  | { type: typeof BOOKING_STEP_TRANSITION_TYPE.STOP }
  | null;

/**
 * prepareStep result for a terminal business hop that still needs one guest-facing
 * text reply: forbid further tool calls so the model cannot re-execute the completed
 * operation (MessageMerger would append another large tool part onto the same
 * assistant message).
 *
 * Prefer this over `undefined` after terminal success — `undefined` restores the
 * full default tool set and enables self-loops.
 */
export const narrationOnlyStep = (): ProcessInputStepResult => ({
  activeTools: [],
  toolChoice: "none",
});

/**
 * Resolves the next booking step-machine transition from the latest tool result.
 *
 * @param toolResult - Last tool name/input/output from the agent step
 * @returns Forced next tool, stop, or null when no transition applies
 */
type TransitionHandler = (
  input: unknown,
  output: Record<string, unknown>,
) => BookingStepTransition;

const stop = (): BookingStepTransition => ({
  type: BOOKING_STEP_TRANSITION_TYPE.STOP,
});

const call = (toolName: string): BookingStepTransition => ({
  type: BOOKING_STEP_TRANSITION_TYPE.CALL,
  toolName,
});

const callIfConfirmed = (
  toolName: string,
  output: Record<string, unknown>,
): BookingStepTransition =>
  output.confirmed === true ? call(toolName) : stop();

const resolveAvailabilityTransition = (
  input: unknown,
  output: Record<string, unknown>,
): BookingStepTransition => {
  const nextAction = output.nextAction;

  const nextActionTransitions: Record<string, BookingStepTransition> = {
    [TOOL_KEYS.ACTION.CONFIRM_BOOKING]: call(
      TOOL_KEYS.ACTION.CONFIRM_BOOKING,
    ),
    [TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING]: call(
      TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING,
    ),
    stop_booking: stop(),
  };

  const explicitTransition = nextActionTransitions[nextAction as string];

  if (explicitTransition) {
    return explicitTransition;
  }

  const availabilityInput = asRecord(input);

  const isAvailable =
    output.available === true &&
    output.guestsWithinCapacity === true;

  if (!isAvailable) {
    return stop();
  }

  const flow = output.flow ?? availabilityInput?.flow;

  const isModify =
    flow === "modify" ||
    typeof availabilityInput?.excludeBookingId === "string";

  return call(
    isModify
      ? TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING
      : TOOL_KEYS.ACTION.CONFIRM_BOOKING,
  );
};

const transitionHandlers: Record<string, TransitionHandler> = {
  [TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY]:
    resolveAvailabilityTransition,

  [TOOL_KEYS.ACTION.EDIT_MODIFY_BOOKING]: (_, output) =>
    callIfConfirmed(
      TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
      output,
    ),

  [TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM]: (_, output) =>
    callIfConfirmed(
      TOOL_KEYS.BOOKING.CANCEL,
      output,
    ),

  [TOOL_KEYS.BOOKING.SHOW_MODIFY_DIALOG_SELECT]: (_, output) =>
    callIfConfirmed(
      TOOL_KEYS.BOOKING.FIND_BY_ID,
      output,
    ),

  [TOOL_KEYS.ACTION.CONFIRM_BOOKING]: (_, output) =>
    callIfConfirmed(
      TOOL_KEYS.BOOKING.CREATE_BOOKING,
      output,
    ),

  [TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING]: (_, output) =>
    callIfConfirmed(
      TOOL_KEYS.BOOKING.UPDATE_BOOKING,
      output,
    ),

  [TOOL_KEYS.BOOKING.CREATE_BOOKING]: stop,
  [TOOL_KEYS.BOOKING.UPDATE_BOOKING]: stop,
  [TOOL_KEYS.BOOKING.CANCEL]: stop,
};

export const resolveBookingStepTransition = ({
  toolName,
  input,
  output,
}: ToolResultLike): BookingStepTransition => {
  const result = asRecord(output);

  if (!toolName || !result) {
    return null;
  }

  const handler = transitionHandlers[toolName];

  return handler ? handler(input, result) : null;
};

/**
 * Reads the last tool result from the most recent agent step.
 *
 * @param steps - Agent step results from prepareStep
 * @returns Last tool result, or null when none exist
 */
const getLastToolResult = (
  steps: ProcessInputStepArgs["steps"],
): ToolResultLike | null => {
  const lastStep = steps.at(-1);
  const lastResult = lastStep?.toolResults.at(-1);

  if (!lastResult) {
    return null;
  }

  return lastResult as ToolResultLike;
};

type ToolInvocationLike = {
  state?: string;
  toolName?: string;
  args?: unknown;
  result?: unknown;
};

/**
 * Reads the newest completed tool result from the current turn's messages.
 *
 * CopilotKit frontend HITL tools run in the browser, so their results arrive as
 * message parts and never appear in `steps[].toolResults`. Reading the messages
 * keeps the HITL -> server-tool hop deterministic. The scan stops at the latest
 * user message so a finished booking flow cannot force a transition on a new turn.
 *
 * @param messages - Messages for the current step
 * @returns Last tool result of this turn, or null when none exist
 */
const getLastToolResultFromMessages = (
  messages: ProcessInputStepArgs["messages"] | undefined,
): ToolResultLike | null => {
  if (!messages?.length) {
    return null;
  }

  const turn = getCurrentTurn(messages);

  for (let index = turn.length - 1; index >= 0; index -= 1) {
    const message = turn[index];

    if (message?.role === "user") {
      return null;
    }

    const parts = asRecord(message?.content)?.parts;

    if (!Array.isArray(parts)) {
      continue;
    }

    for (let cursor = parts.length - 1; cursor >= 0; cursor -= 1) {
      const part = asRecord(parts[cursor]);

      if (part?.type !== "tool-invocation") {
        continue;
      }

      const invocation = asRecord(part.toolInvocation) as
        | ToolInvocationLike
        | null;

      if (invocation?.state !== "result" || !invocation.toolName) {
        continue;
      }

      return {
        toolName: invocation.toolName,
        input: invocation.args as JsonValue | undefined,
        output: invocation.result as JsonValue | undefined,
      };
    }
  }

  return null;
};

type BookingStepSource = {
  toolResult: ToolResultLike;
  transition: Exclude<BookingStepTransition, null>;
};

/**
 * Picks the tool result that decides this step, preferring the agent's own steps
 * and falling back to the messages for browser-executed HITL results.
 *
 * @param args - prepareStep args
 * @returns Deciding tool result with its transition, or null when none applies
 */
const resolveBookingStepSource = (
  args: ProcessInputStepArgs,
): BookingStepSource | null => {
  const candidates = [
    getLastToolResult(args.steps),
    getLastToolResultFromMessages(args.messages),
  ];

  for (const toolResult of candidates) {
    if (!toolResult) {
      continue;
    }

    const transition = resolveBookingStepTransition(toolResult);

    if (transition) {
      return { toolResult, transition };
    }
  }

  return null;
};

/**
 * Stores a confirmed HITL stay on request context for the next forced tool.
 *
 * @param args - prepareStep args (needs requestContext)
 * @param toolName - Previous tool that produced the stay
 * @param stay - Parsed confirmed stay
 */
const stashConfirmedStayForNextTool = (
  args: ProcessInputStepArgs,
  toolName: string | undefined,
  stay: ConfirmedStay,
) => {
  const requestContext = args.requestContext;

  if (!requestContext) {
    return;
  }

  const { EDIT_MODIFY_BOOKING, CONFIRM_MODIFY_BOOKING, CONFIRM_BOOKING } = TOOL_KEYS.ACTION;

  switch (toolName) {
    case EDIT_MODIFY_BOOKING:
      requestContext.set(REQUEST_CONTEXT_KEYS.PENDING_MODIFY_CANDIDATE, stay);
      return;
    case CONFIRM_MODIFY_BOOKING:
      requestContext.set(REQUEST_CONTEXT_KEYS.PENDING_UPDATE_STAY, stay);
      return;
    case CONFIRM_BOOKING:
      requestContext.set(REQUEST_CONTEXT_KEYS.PENDING_CREATE_STAY, stay);
      return;  
    default:
      break;
  }
};

/**
 * Parses cancel picker HITL output into CancelBookingByRoomResult.
 */
const parseCancelBookingByRoomResult = (
  output: unknown,
): CancelBookingByRoomResult | null => {
  const result = asRecord(output);
  if (!result) {
    return null;
  }

  if (result.confirmed === true) {
    const bookingId = asNonEmptyString(result.bookingId);
    if (!bookingId) {
      return null;
    }
    // roomName is required on the shared type but may be omitted at runtime.
    return {
      confirmed: true,
      bookingId,
      roomName: asNonEmptyString(result.roomName) ?? "",
    };
  }

  if (result.confirmed === false) {
    const reason =
      result.reason === "declined" || result.reason === "not_found"
        ? result.reason
        : undefined;
    return reason ? { confirmed: false, reason } : { confirmed: false };
  }

  return null;
};

/**
 * Parses modify picker HITL output into ModifyBookingByRoomResult.
 */
const parseModifyBookingByRoomResult = (
  output: unknown,
): ModifyBookingByRoomResult | null => {
  const result = asRecord(output);
  if (!result) {
    return null;
  }

  const { confirmed, bookingId, roomName } = result;

  if (confirmed) {
    const bookingIdRes = asNonEmptyString(bookingId);
    if (!bookingIdRes) {
      return null;
    }
    return {
      confirmed: true,
      bookingId: bookingIdRes,
      roomName: asNonEmptyString(roomName) ?? "",
    };
  }

  if (!confirmed) {
    const reason =
      result.reason === "declined" || result.reason === "not_found"
        ? result.reason
        : undefined;
    return reason ? { confirmed: false, reason } : { confirmed: false };
  }

  return null;
};

/**
 * Pins the booking id the guest just confirmed in the cancel dialog, so
 * cancel_booking uses it instead of a stale id the model may carry over from an
 * earlier turn in the same thread.
 */
const stashConfirmedCancelBookingId = (
  args: ProcessInputStepArgs,
  toolName: string | undefined,
  output: unknown,
) => {
  if (toolName !== TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM) {
    return;
  }

  const requestContext = args.requestContext;
  const result = parseCancelBookingByRoomResult(output);

  if (!requestContext || !result || result.confirmed !== true) {
    return;
  }

  requestContext.set(
    REQUEST_CONTEXT_KEYS.PENDING_CANCEL_BOOKING_ID,
    result.bookingId,
  );
};

/**
 * Pins the booking id the guest selected in the modify multi-match picker, so
 * find_booking_by_id uses it instead of a stale id the model may guess.
 * Also pins PENDING_MODIFY_ORIGINAL from get_bookings for that id so stated
 * "guests to N" cannot show a sibling booking's guests as the before-state.
 */
const stashConfirmedModifyBookingId = (
  args: ProcessInputStepArgs,
  toolName: string | undefined,
  output: unknown,
) => {
  if (toolName !== TOOL_KEYS.BOOKING.SHOW_MODIFY_DIALOG_SELECT) {
    return;
  }

  const requestContext = args.requestContext;
  const result = parseModifyBookingByRoomResult(output);

  if (!requestContext || !result || result.confirmed !== true) {
    return;
  }

  requestContext.set(
    REQUEST_CONTEXT_KEYS.PENDING_MODIFY_BOOKING_ID,
    result.bookingId,
  );

  const selectedStay = resolveBookingFromGetBookingsInTurn(
    args.messages,
    result.bookingId,
  );
  if (selectedStay) {
    requestContext.set(REQUEST_CONTEXT_KEYS.PENDING_MODIFY_ORIGINAL, {
      bookingId: selectedStay.bookingId,
      ...selectedStay.current,
    });
  }
};

/**
 * Booking step machine: makes tool transitions deterministic inside an agent run.
 * Wired as Mastra `prepareStep`, but this is a state machine — not a generic prepare hook.
 * Forces the next required tool after availability/HITL results and pins the
 * confirmed stay onto request context so server tools ignore stale LLM args.
 *
 * Important: when there is no forced transition, return undefined so CopilotKit
 * frontend HITL tools (confirm/edit/cancel dialogs) stay available. An
 * activeTools allowlist of server tools only would hide those HITL tools.
 *
 * @param args - Mastra prepareStep / processInputStep arguments
 * @returns Tool-choice override for the next step, or undefined
 */
export const enforceBookingStep = (
  args: ProcessInputStepArgs,
): ProcessInputStepResult | undefined => {
  // Stop: do not force the next tool once the run abortSignal is set.
  if (args.abortSignal?.aborted) {
    return {
      activeTools: [],
      toolChoice: "none",
    };
  }

  const source = resolveBookingStepSource(args);

  if (!source) {
    // Mastra prepareStep only: LIST_MY_BOOKINGS (same layer as stated-modify).
    // force → get_bookings hop; narrate → toolChoice none (no re-get_bookings).
    const listDecision = resolveListMyBookingsStep(args);
    if (isActionableBookingStepDecision(listDecision)) {
      return listDecision.step;
    }

    // CANCEL without bookingId: force get_bookings → 0 narrate / 1 find / N>1 HITL list.
    // Runs after LIST so "show my bookings" never opens cancel dialog.
    const cancelDecision = resolveCancelWithoutBookingIdStep(args);
    if (isActionableBookingStepDecision(cancelDecision)) {
      return cancelDecision.step;
    }

    // MODIFY without bookingId: force get_bookings → 0 narrate / 1 find / N>1 HITL picker.
    // Runs after CANCEL so cancel verbs never open the modify picker.
    const modifyDecision = resolveModifyWithoutBookingIdStep(args);
    if (isActionableBookingStepDecision(modifyDecision)) {
      return modifyDecision.step;
    }

    // FIND / BROWSE terminal: block re-search after find_room / get_rooms.
    // book_resolve×1 keeps non-search tools so availability can continue.
    const searchTerminal = tryEnforceSearchTerminalStep(args);
    if (searchTerminal) {
      return searchTerminal;
    }

    // NL stated change after find_booking_by_id / single get_bookings:
    // pin merged stay and force availability so edit_modify_booking never opens.
    return tryEnforceStatedModifyFastPath(args);
  }

  const { toolResult: lastToolResult, transition } = source;
  const { toolName: lastToolName, output: lastToolOutput } = lastToolResult;

  if (transition.type === BOOKING_STEP_TRANSITION_TYPE.STOP) {
    const output = asRecord(lastToolOutput);
    if (
      lastToolName === TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY &&
      output?.stayUnchanged === true
    ) {
      return modifyNoOpNarrationStep(args);
    }

    return narrationOnlyStep();
  }

  if (!args.tools?.[transition.toolName]) {
    return undefined;
  }

  const stay = parseConfirmedStay(lastToolOutput);

  if (stay) {
    stashConfirmedStayForNextTool(args, lastToolName, stay);
  }

  // The cancel dialog result carries no dates, so parseConfirmedStay skips it.
  stashConfirmedCancelBookingId(
    args,
    lastToolName,
    lastToolOutput,
  );

  // The modify picker result carries no dates, so parseConfirmedStay skips it.
  stashConfirmedModifyBookingId(
    args,
    lastToolName,
    lastToolOutput,
  );

  return {
    activeTools: [transition.toolName],
    toolChoice: {
      type: "tool",
      toolName: transition.toolName,
    },
  };
};

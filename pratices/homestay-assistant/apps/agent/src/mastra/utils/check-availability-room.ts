import type { z } from "zod";
import type { RequestContext } from "@mastra/core/request-context";

import { addDaysYmd, getBusinessDates } from "@repo/utils";
import { checkRoomAvailabilityInputSchema } from "@repo/schemas";
import { MODEL_NAME } from "@repo/types";
import { assertOwnedActiveBooking, checkRoomAvailability } from "../services";
import { serviceContextFromTool } from "./abort";
import {
  isSameModifyStay,
  ModifyStayFields,
  resolveModifyAvailabilityNextAction,
} from "../booking";
import {
  clearPinnedStay,
  readPinnedCreateCandidate,
  readPinnedStay,
} from "./resolve-pinned-stay";
import { REQUEST_CONTEXT_KEYS } from "../middleware";
import type {
  CheckRoomAvailabilityOutput,
  CheckRoomAvailabilityResponse,
} from "../schemas/booking";

type AvailabilityCandidate =
  | {
      type: MODEL_NAME.CREATE;
      roomId: string;
      checkInDate: string;
      checkOutDate: string;
      guests: number;
    }
  | {
      type: MODEL_NAME.MODIFY;
      roomId: string;
      checkInDate: string;
      checkOutDate: string;
      guests: number;
      bookingId: string;
      originalStay: ModifyStayFields | null;
    };
type ToolContext = {
  requestContext?: RequestContext;
  abortSignal?: AbortSignal;
};

type AvailabilityEvaluation = {
  available: boolean;
  guestsWithinCapacity: boolean;
  room: CheckRoomAvailabilityResponse["room"];
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  stayUnchanged: boolean;
  nextAction: ReturnType<typeof resolveModifyAvailabilityNextAction>;
  originalStay: ModifyStayFields | null;
};

// Pre-transform shape (matches the tool's actual `execute` input type — flow
// and excludeBookingId are optional here; the schema only defaults/requires
// them after transform/superRefine, which run before `execute` but aren't
// reflected in this static type).
type RawCandidateInput = z.input<typeof checkRoomAvailabilityInputSchema>;

type ModifyCandidateInput = {
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  flow: MODEL_NAME.MODIFY;
  excludeBookingId: string;
};

type CreateCandidateInput = {
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  flow: MODEL_NAME.CREATE;
  excludeBookingId?: undefined;
};

/**
 * After edit_modify_booking / stated-modify, or after find_room(book_resolve)
 * resolves a BOOK with a known check-in + guest count, prepareStep pins the
 * resolved stay so stale/incorrect LLM args (original booking, working
 * memory, a re-read of the wrong message) cannot win. Clears the pin once
 * read so it only applies to this call.
 */
const resolveCandidateInput = (
  input: RawCandidateInput,
  requestContext: RequestContext | undefined,
): {
  resolved: RawCandidateInput | ModifyCandidateInput | CreateCandidateInput;
  pinnedOriginal: ModifyStayFields | null;
} => {
  const pinnedModify = readPinnedStay(
    requestContext,
    REQUEST_CONTEXT_KEYS.PENDING_MODIFY_CANDIDATE,
  );
  const pinnedOriginal = readPinnedStay(
    requestContext,
    REQUEST_CONTEXT_KEYS.PENDING_MODIFY_ORIGINAL,
  );
  const roomId = pinnedModify?.roomId;
  const bookingId = pinnedModify?.bookingId;

  if (pinnedModify && roomId && bookingId) {
    clearPinnedStay(
      requestContext,
      REQUEST_CONTEXT_KEYS.PENDING_MODIFY_CANDIDATE,
    );
    clearPinnedStay(requestContext, REQUEST_CONTEXT_KEYS.PENDING_MODIFY_ORIGINAL);

    return {
      resolved: {
        roomId,
        checkInDate: pinnedModify.checkInDate,
        checkOutDate: pinnedModify.checkOutDate,
        guests: pinnedModify.guests,
        flow: MODEL_NAME.MODIFY,
        excludeBookingId: bookingId,
      },
      pinnedOriginal,
    };
  }

  const pinnedCreate = readPinnedCreateCandidate(requestContext);
  if (pinnedCreate) {
    clearPinnedStay(requestContext, REQUEST_CONTEXT_KEYS.PENDING_CREATE_CANDIDATE);

    // checkOutDate is never pinned — only the model's own stated stay length
    // (from THIS call's args) or the +1 day default reflects the guest's
    // actual request.
    const statedCheckOut =
      typeof input.checkOutDate === "string" ? input.checkOutDate.trim() : "";

    return {
      resolved: {
        roomId: pinnedCreate.roomId,
        checkInDate: pinnedCreate.checkInDate,
        checkOutDate: statedCheckOut || addDaysYmd(pinnedCreate.checkInDate, 1),
        guests: pinnedCreate.guests,
        flow: MODEL_NAME.CREATE,
      },
      pinnedOriginal,
    };
  }

  return { resolved: input, pinnedOriginal };
};

/**
 * Pre-change stay for a modify candidate. Prefers the pinned original from
 * the stated-modify / picker fast path; falls back to the booking's real
 * current stay so a genuine no-op modify is still caught even when the model
 * called this tool directly instead of going through that path. Best-effort
 * only — ownership/existence is re-asserted before the mutation in update_booking.
 */
const resolveOriginalStay = async (
  bookingId: string,
  pinnedOriginal: ModifyStayFields | null,
  context: ToolContext,
): Promise<ModifyStayFields | null> => {
  if (pinnedOriginal) {
    return pinnedOriginal;
  }

  if (!bookingId) {
    return null;
  }

  try {
    const booking = await assertOwnedActiveBooking(
      bookingId,
      serviceContextFromTool(context),
    );
    return {
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      guests: booking.guests,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    return null;
  }
};

export const resolveAvailabilityCandidate = (
  input: RawCandidateInput,
  requestContext: RequestContext | undefined,
): AvailabilityCandidate => {
  const { resolved, pinnedOriginal } = resolveCandidateInput(
    input,
    requestContext,
  );
  const { excludeBookingId, checkInDate, checkOutDate, guests, roomId } =
    resolved;

  const flow =
    resolved.flow ??
    (excludeBookingId?.trim() ? MODEL_NAME.MODIFY : MODEL_NAME.CREATE);
  const availabilityCandidate = {
    roomId,
    checkInDate,
    checkOutDate,
    guests,
  };

  if (flow === MODEL_NAME.MODIFY) {
    const bookingId = excludeBookingId?.trim();

    if (!bookingId) {
      throw new Error("excludeBookingId is required when flow is modify");
    }

    return {
      ...availabilityCandidate,
      type: MODEL_NAME.MODIFY,
      bookingId,
      originalStay: pinnedOriginal,
    };
  }

  return {
    ...availabilityCandidate,
    type: MODEL_NAME.CREATE,
  };
};

export const validateAvailabilityCandidate = (
  candidate: AvailabilityCandidate,
) => {
  const { today } = getBusinessDates();
  const { checkInDate, checkOutDate } = candidate;

  if (checkInDate < today) {
    throw new Error(`checkInDate must be on or after today (${today})`);
  }

  if (checkOutDate <= checkInDate) {
    throw new Error(
      `checkOutDate ${checkOutDate} must be after checkInDate ${checkInDate}. Today is ${today}.`,
    );
  }
};

const checkCandidateAvailability = async (
  candidate: AvailabilityCandidate,
  context: ToolContext,
) => {
  const serviceContext = serviceContextFromTool(context);

  return checkRoomAvailability(
    {
      roomId: candidate.roomId,
      checkInDate: candidate.checkInDate,
      checkOutDate: candidate.checkOutDate,
      guests: candidate.guests,
      ...(candidate.type === MODEL_NAME.MODIFY
        ? {
            excludeBookingId: candidate.bookingId,
          }
        : {}),
    },
    serviceContext,
  );
};

const resolveCandidateOriginalStay = async (
  candidate: AvailabilityCandidate,
  context: ToolContext,
): Promise<ModifyStayFields | null> => {
  if (candidate.type !== MODEL_NAME.MODIFY) {
    return null;
  }

  if (candidate.originalStay) {
    return candidate.originalStay;
  }

  return resolveOriginalStay(candidate.bookingId, null, context);
};

export const evaluateAvailabilityCandidate = async (
  candidate: AvailabilityCandidate,
  context: ToolContext,
): Promise<AvailabilityEvaluation> => {
  const originalStay = await resolveCandidateOriginalStay(candidate, context);
  const modifyMode = candidate.type === MODEL_NAME.MODIFY;
  const availableCandidate = {
    checkInDate: candidate.checkInDate,
    checkOutDate: candidate.checkOutDate,
    guests: candidate.guests,
  };
  const stayUnchanged = Boolean(
    modifyMode &&
    originalStay &&
    isSameModifyStay(availableCandidate, originalStay),
  );

  const result = await checkCandidateAvailability(candidate, context);
  const { available, guestsWithinCapacity, room } = result;

  // A no-op does not need an availability decision. The API still receives
  // excludeBookingId, but an unrelated overlap or stale room state must not
  // turn an unchanged booking into a BookingUnavailable response.
  const effectiveAvailable = stayUnchanged ? true : available;
  const effectiveGuestsWithinCapacity = stayUnchanged
    ? true
    : guestsWithinCapacity;

  const nextAction = resolveModifyAvailabilityNextAction({
    available: effectiveAvailable,
    guestsWithinCapacity: effectiveGuestsWithinCapacity,
    isModify: modifyMode,
    stayUnchanged,
  });
  return {
    ...availableCandidate,
    available: effectiveAvailable,
    guestsWithinCapacity: effectiveGuestsWithinCapacity,
    room,
    stayUnchanged,
    nextAction,
    originalStay,
  };
};

export const buildAvailabilityResult = (
  candidate: AvailabilityCandidate,
  evaluation: AvailabilityEvaluation,
): CheckRoomAvailabilityOutput => {
  const {
    available,
    guestsWithinCapacity,
    room,
    checkInDate,
    checkOutDate,
    guests,
    nextAction,
    originalStay,
    stayUnchanged,
  } = evaluation;
  const { type } = candidate;
  const result = {
    available,
    guestsWithinCapacity,
    room,
    checkInDate,
    checkOutDate,
    guests,
    nextAction,
    flow: type,
  };

  if (type === MODEL_NAME.MODIFY) {
    return {
      ...result,
      bookingId: candidate.bookingId,
      ...(stayUnchanged ? { stayUnchanged: true as const } : {}),
      ...(originalStay
        ? {
            originalCheckInDate: originalStay.checkInDate,
            originalCheckOutDate: originalStay.checkOutDate,
            originalGuests: originalStay.guests,
          }
        : {}),
    };
  }

  return result;
};

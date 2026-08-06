// Libs
import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import {
  checkRoomAvailabilityOutputSchema,
  type CheckRoomAvailabilityOutput,
} from "@/mastra/schemas/booking";
import {
  assertOwnedActiveBooking,
  checkRoomAvailability,
} from "@/mastra/services";
import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import {
  clearPinnedStay,
  readPinnedStay,
} from "@/mastra/utils/resolve-pinned-stay";
import { getBusinessDates } from "@repo/utils/date";
import {
  serviceContextFromTool,
  throwIfAborted,
} from "@/mastra/utils/abort";
import { checkRoomAvailabilityInputSchema, BOOKING_DRAFT_MODE, BOOKING_DRAFT_STATUS } from "@repo/schemas";
import { resolveAgentUserId } from "@/mastra/utils/resolve-agent-user-id";
import {
  readBookingDraftStayForAvailability,
  setBookingDraftStatus,
} from "@/mastra/booking/booking-draft-context";

type ModifyOriginalStay = {
  bookingId: string;
  originalCheckInDate: string;
  originalCheckOutDate: string;
  originalGuests: number;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

/**
 * Prefers the stay snapshot pinned by the stated-change fast path; otherwise
 * loads the excluded booking so confirm_modify always gets old → new fields.
 */
const resolveModifyOriginals = async (
  excludeBookingId: string,
  context: {
    requestContext?: Parameters<typeof readPinnedStay>[0];
    abortSignal?: AbortSignal;
  },
): Promise<ModifyOriginalStay | null> => {
  const stashed = asRecord(
    context.requestContext?.get(REQUEST_CONTEXT_KEYS.PENDING_MODIFY_ORIGINAL),
  );

  if (stashed) {
    const bookingId =
      typeof stashed.bookingId === "string" ? stashed.bookingId.trim() : "";
    const originalCheckInDate =
      typeof stashed.checkInDate === "string"
        ? stashed.checkInDate.trim()
        : typeof stashed.originalCheckInDate === "string"
          ? stashed.originalCheckInDate.trim()
          : "";
    const originalCheckOutDate =
      typeof stashed.checkOutDate === "string"
        ? stashed.checkOutDate.trim()
        : typeof stashed.originalCheckOutDate === "string"
          ? stashed.originalCheckOutDate.trim()
          : "";
    const originalGuests =
      typeof stashed.guests === "number"
        ? stashed.guests
        : typeof stashed.originalGuests === "number"
          ? stashed.originalGuests
          : NaN;

    if (
      bookingId &&
      originalCheckInDate &&
      originalCheckOutDate &&
      Number.isInteger(originalGuests) &&
      originalGuests > 0
    ) {
      clearPinnedStay(
        context.requestContext,
        REQUEST_CONTEXT_KEYS.PENDING_MODIFY_ORIGINAL,
      );
      return {
        bookingId,
        originalCheckInDate,
        originalCheckOutDate,
        originalGuests,
      };
    }
  }

  try {
    const userId = resolveAgentUserId(
      context,
      "Authentication required to check room availability",
    );
    const booking = await assertOwnedActiveBooking(
      userId,
      excludeBookingId,
      serviceContextFromTool(context),
    );

    return {
      bookingId: booking.id,
      originalCheckInDate: booking.checkInDate,
      originalCheckOutDate: booking.checkOutDate,
      originalGuests: booking.guests,
    };
  } catch {
    return null;
  }
};

export const checkRoomAvailabilityTool = createTool({
  id: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
  description:
    "Check room dates and guest capacity before booking. Always pass flow: use flow=create for a NEW stay (omit excludeBookingId); use flow=modify for an existing booking and always pass excludeBookingId=bookingId. CREATE: use absolute YYYY-MM-DD dates and guests from the latest message. MODIFY: use checkInDate, checkOutDate, and guests from the edit_modify_booking confirmed:true result — or, when the guest already stated the new dates/guests and the edit form was skipped, those stated values merged over the resolved booking's current stay (the step machine may pin them). Never use the original booking dates unchanged or a working-memory draft. The result includes mandatory nextAction + flow, and for modify also bookingId + originalCheckInDate/originalCheckOutDate/originalGuests for confirm_modify_booking diffs. Call confirm_booking only for create, confirm_modify_booking only for modify, or stop when stop_booking. Never answer only that the room is available and never call create_booking/update_booking before confirmation.",
  inputSchema: checkRoomAvailabilityInputSchema,
  outputSchema: checkRoomAvailabilityOutputSchema,
  execute: async (input, context) => {
    throwIfAborted(context.abortSignal);

    const { today } = getBusinessDates();

    // After edit_modify_booking (or the stated-change fast path), prepareStep
    // pins the candidate stay so stale LLM args cannot win.
    const pinned = readPinnedStay(
      context.requestContext,
      REQUEST_CONTEXT_KEYS.PENDING_MODIFY_CANDIDATE,
    );
    const pinnedRoomId = pinned?.roomId;
    const pinnedBookingId = pinned?.bookingId;
    const isPinnedModify = Boolean(pinned && pinnedRoomId && pinnedBookingId);

    // CREATE: prefer authoritative Booking Draft over reconstructing from LLM args.
    const draftStay = isPinnedModify
      ? null
      : readBookingDraftStayForAvailability(context.requestContext);

    const resolved =
      isPinnedModify && pinned && pinnedRoomId && pinnedBookingId
        ? {
            roomId: pinnedRoomId,
            checkInDate: pinned.checkInDate,
            checkOutDate: pinned.checkOutDate,
            guests: pinned.guests,
            flow: "modify" as const,
            excludeBookingId: pinnedBookingId,
          }
        : draftStay && draftStay.mode === BOOKING_DRAFT_MODE.CREATE
          ? {
              roomId: draftStay.roomId,
              checkInDate: draftStay.checkInDate,
              checkOutDate: draftStay.checkOutDate,
              guests: draftStay.guests,
              flow: "create" as const,
            }
          : input;

    if (isPinnedModify) {
      clearPinnedStay(
        context.requestContext,
        REQUEST_CONTEXT_KEYS.PENDING_MODIFY_CANDIDATE,
      );
    }

    if (resolved.checkInDate < today) {
      throw new Error(`checkInDate must be on or after today (${today})`);
    }

    if (resolved.checkOutDate <= resolved.checkInDate) {
      throw new Error(
        `checkOutDate ${resolved.checkOutDate} must be after checkInDate ${resolved.checkInDate}. Today is ${today}.`,
      );
    }

    const flow: CheckRoomAvailabilityOutput["flow"] =
      resolved.flow ??
      (resolved.excludeBookingId?.trim() ? "modify" : "create");
    const isModify = flow === "modify";

    if (isModify && !resolved.excludeBookingId?.trim()) {
      throw new Error(
        "excludeBookingId is required when flow is modify",
      );
    }

    throwIfAborted(context.abortSignal);

    const result = await checkRoomAvailability(
      {
        roomId: resolved.roomId,
        checkInDate: resolved.checkInDate,
        checkOutDate: resolved.checkOutDate,
        guests: resolved.guests,
        ...(isModify && resolved.excludeBookingId
          ? { excludeBookingId: resolved.excludeBookingId }
          : {}),
      },
      serviceContextFromTool(context),
    );

    const nextAction: CheckRoomAvailabilityOutput["nextAction"] =
      result.available && result.guestsWithinCapacity
        ? isModify
          ? "confirm_modify_booking"
          : "confirm_booking"
        : "stop_booking";

    const originals =
      isModify && resolved.excludeBookingId?.trim()
        ? await resolveModifyOriginals(resolved.excludeBookingId.trim(), context)
        : null;

    if (nextAction === "confirm_booking" || nextAction === "confirm_modify_booking") {
      setBookingDraftStatus(
        context.requestContext,
        BOOKING_DRAFT_STATUS.READY_FOR_CONFIRM,
      );
    }

    return {
      ...result,
      nextAction,
      flow,
      ...(originals
        ? {
            bookingId: originals.bookingId,
            originalCheckInDate: originals.originalCheckInDate,
            originalCheckOutDate: originals.originalCheckOutDate,
            originalGuests: originals.originalGuests,
          }
        : isModify && resolved.excludeBookingId?.trim()
          ? { bookingId: resolved.excludeBookingId.trim() }
          : {}),
    };
  },
});

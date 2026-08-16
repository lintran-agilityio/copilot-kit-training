// Libs
import { createTool } from "@mastra/core/tools";
import type { RequestContext } from "@mastra/core/request-context";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import { checkRoomAvailabilityOutputSchema } from "@/mastra/schemas/booking";
import {
  assertOwnedActiveBooking,
  checkRoomAvailability,
} from "@/mastra/services";
import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import {
  resolveModifyAvailabilityNextAction,
  isSameModifyStay,
  type ModifyStayFields,
} from "@/mastra/booking";
import {
  clearPinnedStay,
  readPinnedStay,
} from "@/mastra/utils/resolve-pinned-stay";
import { getBusinessDates } from "@repo/utils/date";
import { serviceContextFromTool, throwIfAborted } from "@/mastra/utils/abort";
import { checkRoomAvailabilityInputSchema } from "@repo/schemas";
import type { z } from "zod";

type ToolContext = {
  requestContext?: RequestContext;
  abortSignal?: AbortSignal;
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
  flow: "modify";
  excludeBookingId: string;
};

/**
 * After edit_modify_booking / stated-modify, prepareStep pins the guest-
 * selected stay so stale LLM args (original booking / working memory) cannot
 * win. Clears the pin once read so it only applies to this call.
 */
const resolveCandidateInput = (
  input: RawCandidateInput,
  requestContext: RequestContext | undefined,
): {
  resolved: RawCandidateInput | ModifyCandidateInput;
  pinnedOriginal: ModifyStayFields | null;
} => {
  const pinned = readPinnedStay(
    requestContext,
    REQUEST_CONTEXT_KEYS.PENDING_MODIFY_CANDIDATE,
  );
  const pinnedOriginal = readPinnedStay(
    requestContext,
    REQUEST_CONTEXT_KEYS.PENDING_MODIFY_ORIGINAL,
  );
  const roomId = pinned?.roomId;
  const bookingId = pinned?.bookingId;

  if (!pinned || !roomId || !bookingId) {
    return { resolved: input, pinnedOriginal };
  }

  clearPinnedStay(
    requestContext,
    REQUEST_CONTEXT_KEYS.PENDING_MODIFY_CANDIDATE,
  );
  clearPinnedStay(
    requestContext,
    REQUEST_CONTEXT_KEYS.PENDING_MODIFY_ORIGINAL,
  );

  return {
    resolved: {
      roomId,
      checkInDate: pinned.checkInDate,
      checkOutDate: pinned.checkOutDate,
      guests: pinned.guests,
      flow: "modify",
      excludeBookingId: bookingId,
    },
    pinnedOriginal,
  };
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

export const checkRoomAvailabilityTool = createTool({
  id: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
  description: `
    Check room dates and guest capacity before booking. The result always includes nextAction and flow — follow nextAction exactly.
      - Always pass flow: flow=create for a NEW stay (omit excludeBookingId); flow=modify for an existing booking, always with excludeBookingId=bookingId.
      - CREATE: use absolute YYYY-MM-DD dates and guests from the latest message when present; otherwise reuse an established prior find_room.date as checkInDate and default checkOutDate = checkInDate + 1 day when stay length was not given (date continuity). The latest message wins only when it supplies a new date or stay length.
      - MODIFY: use checkInDate, checkOutDate, and guests from the edit_modify_booking confirmed:true result — or, when the guest already stated new dates/guests and the edit form was skipped, those stated values merged over the resolved booking's current stay. Never reuse the original booking dates unchanged or a stale working-memory draft.
      - nextAction: confirm_booking for create, CONFIRM_MODIFY_BOOKING for modify, or stop_booking when unavailable, guests exceed capacity, or (modify only) the candidate matches the original stay unchanged. On stop_booking, reply briefly and do NOT open a confirm dialog.
      - Never answer only that the room is available, and never call create_booking/update_booking before confirmation.
    `,
  inputSchema: checkRoomAvailabilityInputSchema,
  outputSchema: checkRoomAvailabilityOutputSchema,
  execute: async (input, context) => {
    throwIfAborted(context.abortSignal);

    const { today } = getBusinessDates();
    const { resolved, pinnedOriginal } = resolveCandidateInput(
      input,
      context.requestContext,
    );

    if (resolved.checkInDate < today) {
      throw new Error(`checkInDate must be on or after today (${today})`);
    }

    if (resolved.checkOutDate <= resolved.checkInDate) {
      throw new Error(
        `checkOutDate ${resolved.checkOutDate} must be after checkInDate ${resolved.checkInDate}. Today is ${today}.`,
      );
    }

    const flow =
      resolved.flow ?? (resolved.excludeBookingId?.trim() ? "modify" : "create");
    const isModify = flow === "modify";
    const modifyBookingId = resolved.excludeBookingId?.trim() ?? "";

    if (isModify && !modifyBookingId) {
      throw new Error("excludeBookingId is required when flow is modify");
    }

    throwIfAborted(context.abortSignal);

    const result = await checkRoomAvailability(
      {
        roomId: resolved.roomId,
        checkInDate: resolved.checkInDate,
        checkOutDate: resolved.checkOutDate,
        guests: resolved.guests,
        ...(isModify && modifyBookingId
          ? { excludeBookingId: modifyBookingId }
          : {}),
      },
      serviceContextFromTool(context),
    );

    const candidate: ModifyStayFields = {
      checkInDate: resolved.checkInDate,
      checkOutDate: resolved.checkOutDate,
      guests: resolved.guests,
    };

    const originalStay = isModify
      ? await resolveOriginalStay(modifyBookingId, pinnedOriginal, context)
      : null;

    const stayUnchanged = Boolean(
      isModify && originalStay && isSameModifyStay(candidate, originalStay),
    );

    const nextAction = resolveModifyAvailabilityNextAction({
      available: result.available,
      guestsWithinCapacity: result.guestsWithinCapacity,
      isModify,
      stayUnchanged,
    });

    return {
      ...result,
      nextAction,
      flow,
      ...(stayUnchanged ? { stayUnchanged: true as const } : {}),
      ...(isModify && modifyBookingId
        ? {
            bookingId: modifyBookingId,
            ...(originalStay
              ? {
                  originalCheckInDate: originalStay.checkInDate,
                  originalCheckOutDate: originalStay.checkOutDate,
                  originalGuests: originalStay.guests,
                }
              : {}),
          }
        : {}),
    };
  },
});

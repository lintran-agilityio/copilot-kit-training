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
import { resolveModifyAvailabilityNextAction, isSameModifyStay } from "@/mastra/booking";
import {
  clearPinnedStay,
  readPinnedStay,
} from "@/mastra/utils/resolve-pinned-stay";
import { getBusinessDates } from "@repo/utils/date";
import { serviceContextFromTool, throwIfAborted } from "@/mastra/utils/abort";
import { checkRoomAvailabilityInputSchema } from "@repo/schemas";

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

    // After edit_modify_booking / stated-modify, prepareStep pins the guest-
    // selected stay so stale LLM args (original booking / working memory)
    // cannot win. PENDING_MODIFY_ORIGINAL carries pre-change stay for diffs.
    const pinned = readPinnedStay(
      context.requestContext,
      REQUEST_CONTEXT_KEYS.PENDING_MODIFY_CANDIDATE,
    );
    const pinnedOriginal = readPinnedStay(
      context.requestContext,
      REQUEST_CONTEXT_KEYS.PENDING_MODIFY_ORIGINAL,
    );
    const pinnedRoomId = pinned?.roomId;
    const pinnedBookingId = pinned?.bookingId;
    const isPinnedModify = Boolean(pinned && pinnedRoomId && pinnedBookingId);

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
        : input;

    if (isPinnedModify) {
      clearPinnedStay(
        context.requestContext,
        REQUEST_CONTEXT_KEYS.PENDING_MODIFY_CANDIDATE,
      );
      clearPinnedStay(
        context.requestContext,
        REQUEST_CONTEXT_KEYS.PENDING_MODIFY_ORIGINAL,
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
      throw new Error("excludeBookingId is required when flow is modify");
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

    const candidate = {
      checkInDate: resolved.checkInDate,
      checkOutDate: resolved.checkOutDate,
      guests: resolved.guests,
    };

    const modifyBookingId =
      (typeof resolved.excludeBookingId === "string"
        ? resolved.excludeBookingId.trim()
        : "") ||
      (typeof pinnedBookingId === "string" ? pinnedBookingId.trim() : "");

    let originalStay = pinnedOriginal
      ? {
          checkInDate: pinnedOriginal.checkInDate,
          checkOutDate: pinnedOriginal.checkOutDate,
          guests: pinnedOriginal.guests,
        }
      : null;

    // No pinned original (e.g. the model called this directly instead of
    // going through the stated-modify / picker fast path) — fall back to the
    // booking's real current stay so a genuine no-op modify is still caught,
    // instead of trusting whatever "current" values the model guessed.
    if (isModify && !originalStay && modifyBookingId) {
      try {
        const currentBooking = await assertOwnedActiveBooking(
          modifyBookingId,
          serviceContextFromTool(context),
        );
        originalStay = {
          checkInDate: currentBooking.checkInDate,
          checkOutDate: currentBooking.checkOutDate,
          guests: currentBooking.guests,
        };
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw error;
        }
        // Best-effort only — ownership/existence is re-asserted before the
        // actual mutation in update_booking.
      }
    }

    const nextAction = resolveModifyAvailabilityNextAction({
      available: result.available,
      guestsWithinCapacity: result.guestsWithinCapacity,
      isModify,
      candidate,
      original: originalStay,
    });

    const stayUnchanged = Boolean(
      isModify && originalStay && isSameModifyStay(candidate, originalStay),
    );

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

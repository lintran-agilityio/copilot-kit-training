// Libs
import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS } from "@repo/constants/tool-keys";
import {
  checkRoomAvailabilityOutputSchema,
  type CheckRoomAvailabilityOutput,
} from "@/mastra/schemas/booking";
import { checkRoomAvailability } from "@/mastra/services";
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
import { checkRoomAvailabilityInputSchema } from "@repo/schemas";

export const checkRoomAvailabilityTool = createTool({
  id: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
  description:
    "Check room dates and guest capacity before booking. Always pass flow: use flow=create for a NEW stay (omit excludeBookingId); use flow=modify for an existing booking and always pass excludeBookingId=bookingId. CREATE: use absolute YYYY-MM-DD dates and guests from the latest message when present; otherwise reuse an established prior find_room.date as checkInDate and default checkOutDate = checkInDate + 1 day when stay length was not given (Date continuity). Latest message wins only when it supplies a new date or stay length. MODIFY: use checkInDate, checkOutDate, and guests from the edit_modify_booking confirmed:true result — or, when the guest already stated the new dates/guests and the edit form was skipped, those stated values merged over the resolved booking's current stay. Never use the original booking dates unchanged or a working-memory draft. The result includes mandatory nextAction + flow: call confirm_booking only for create, CONFIRM_MODIFY_BOOKING only for modify, or stop when stop_booking. Never answer only that the room is available and never call create_booking/update_booking before confirmation.",
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
          ? "CONFIRM_MODIFY_BOOKING"
          : "confirm_booking"
        : "stop_booking";

    const modifyBookingId =
      (typeof resolved.excludeBookingId === "string"
        ? resolved.excludeBookingId.trim()
        : "") ||
      (typeof pinnedBookingId === "string" ? pinnedBookingId.trim() : "");

    return {
      ...result,
      nextAction,
      flow,
      ...(isModify && modifyBookingId
        ? {
            bookingId: modifyBookingId,
            ...(pinnedOriginal
              ? {
                  originalCheckInDate: pinnedOriginal.checkInDate,
                  originalCheckOutDate: pinnedOriginal.checkOutDate,
                  originalGuests: pinnedOriginal.guests,
                }
              : {}),
          }
        : {}),
    };
  },
});

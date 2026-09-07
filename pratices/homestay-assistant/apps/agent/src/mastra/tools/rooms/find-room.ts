import { createTool } from "@mastra/core/tools";

import { TOOL_KEYS, TOOL_PURPOSE } from "@repo/constants";
import { addDaysYmd, isAbortError } from "@repo/utils";
import {
  findRoomInputSchema,
  findRoomOutputSchema,
  type FindRoomAvailability,
} from "@/mastra/schemas/rooms";
import { checkRoomAvailability, findRooms } from "@/mastra/services";
import { toFindRoomModelOutput } from "@/mastra/utils";
import { readBookingFormStayHint } from "@/mastra/utils/book-form-prefill";
import {
  serviceContextFromTool,
  throwIfAborted,
} from "@/mastra/utils/abort";

const NAME_ONLY_PURPOSES = new Set<string | undefined>([
  TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE,
  TOOL_PURPOSE.FIND_ROOM.RESOLVE,
]);

type FindRoomProbeInput = { date?: string; guests?: number };
type FindRoomToolContext = Parameters<typeof serviceContextFromTool>[0];

/**
 * Resolve the full stay for the CREATE-flow availability probe, or `null` when
 * the guest has not committed to both a check-in date and a guest count.
 *
 * Sources, in order: the values echoed on this call (already normalized to an
 * absolute date / positive int by `normalizeFindRoomInput`), then an earlier
 * dated/guest-count `find_room` in this conversation
 * (`PENDING_BOOKING_FORM_STAY_HINT`, restashed every step by
 * `BookingFormPrefillProcessor`). When either is still missing the probe is
 * skipped — the platform opens the Booking Form and the form runs its own
 * check — so a "today / 1 guest" placeholder never drives routing.
 */
const resolveProbeStay = (
  input: FindRoomProbeInput,
  requestContext: Parameters<typeof readBookingFormStayHint>[0],
): { checkInDate: string; checkOutDate: string; guests: number } | null => {
  const hint = readBookingFormStayHint(requestContext);
  const checkInDate = (input.date?.trim() || undefined) ?? hint?.checkInDate;
  const guests = input.guests ?? hint?.guests;

  if (!checkInDate || !guests) {
    return null;
  }

  return {
    checkInDate,
    // find_room carries no stay length — a 1-night window is enough to catch a
    // taken date; `create_booking` re-checks the full range server-side.
    checkOutDate: addDaysYmd(checkInDate, 1),
    guests,
  };
};

/**
 * BOOK CREATE flow: probe availability for a resolved named room (only when the
 * full stay is known) so the flow never needs a separate
 * `check_room_availability` tool call. A missing stay or a failed probe returns
 * `undefined` — the platform opens the Booking Form or forces `confirm_booking`
 * anyway, and `POST /bookings` stays the authoritative gate.
 */
const probeBookResolveAvailability = async (
  roomId: string,
  input: FindRoomProbeInput,
  context: FindRoomToolContext,
): Promise<FindRoomAvailability | undefined> => {
  const stay = resolveProbeStay(input, context.requestContext);
  if (!stay) {
    return undefined;
  }

  try {
    const result = await checkRoomAvailability(
      {
        roomId,
        checkInDate: stay.checkInDate,
        checkOutDate: stay.checkOutDate,
        guests: stay.guests,
      },
      serviceContextFromTool(context),
    );

    return {
      available: result.available,
      guestsWithinCapacity: result.guestsWithinCapacity,
      checkInDate: stay.checkInDate,
      checkOutDate: stay.checkOutDate,
      guests: stay.guests,
    };
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    return undefined;
  }
};

export const findRoomTool = createTool({
  id: TOOL_KEYS.GET.FIND_ROOM,
  description: `
    Find rooms matching the guest's request.

    Use when the guest:
    - searches for rooms
    - asks which rooms are available
    - filters rooms by name, date, guests, or room level
    - requests a booking for a specific named room

    Purpose:
    - search: find/show/filter rooms for the guest
    - book_resolve: resolve a specific named room for a booking flow
    - recommend: find suitable rooms when no specific room was requested
  `,
  strict: true,
  inputSchema: findRoomInputSchema,
  outputSchema: findRoomOutputSchema,
  execute: async (input, context) => {
    throwIfAborted(context.abortSignal);
    // inputSchema already runs normalizeFindRoomInput
    if (NAME_ONLY_PURPOSES.has(input.purpose)) {
      // date/guests on `input` here are stated hints only (see
      // normalizeFindRoomInput) — never let them filter a named-room lookup.
      // They are echoed back for the BOOK step machine to route on, and (for
      // book_resolve + exactly one match) drive the availability probe below
      // that replaces the CREATE-flow check_room_availability call.
      const result = await findRooms(
        { purpose: input.purpose, name: input.name },
        serviceContextFromTool(context),
      );

      const echoed = { ...result, date: input.date, guests: input.guests };

      if (
        input.purpose === TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE &&
        result.rooms.length === 1 &&
        result.rooms[0]?.id
      ) {
        const availability = await probeBookResolveAvailability(
          result.rooms[0].id,
          input,
          context,
        );
        return availability ? { ...echoed, availability } : echoed;
      }

      return echoed;
    }
    const result = await findRooms(input, serviceContextFromTool(context));
    // `limit` trims the search to the top N matches when the guest asked for a
    // specific count ("find me 3 rooms"). Applied here so both the chat cards
    // (FindRoomNotice reads the raw result) and the model's compare candidates
    // see the same trimmed set.
    return input.limit && input.limit < result.rooms.length
      ? { ...result, rooms: result.rooms.slice(0, input.limit) }
      : result;
  },
  toModelOutput: toFindRoomModelOutput,
});

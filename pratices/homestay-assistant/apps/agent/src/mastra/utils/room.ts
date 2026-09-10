import { TOOL_PURPOSE } from "@repo/constants";
import type { FindRoomInput } from "@repo/schemas";
import type { FindRoomOutput, GetRoomDetailOutput } from "@/mastra/schemas/rooms";
import { buildFindRoomReplyHint } from "./generic-ui";
import {
  isCalendarOnlyRoomName,
  isRoomLevelCategoryName,
  sanitizeFindRoomName,
  sanitizeFindRoomDate
} from "./sanitize-find-room";
import {
  clearBookingFormStayHint,
  readBookingFormStayHint,
} from "./book-form-prefill";
import { addDaysYmd } from "@repo/utils";

/** Top-floor / luxury category → floor level in seed catalog. */
export const LUXURY_ROOM_LEVEL = 4;

/**
 * `book_resolve` / `resolve` are name-only room lookups (a specific room was
 * named) — the matched room comes from `name` alone. `guests`/`date`/`level`
 * must never gate this match: the model can attach any of them to a named-room
 * call (e.g. inferring `level: 4` from "Loft" the way it would from "penthouse"),
 * and an inferred value narrower than the real room silently zeroes the result.
 * Relying on prompt wording or a category-word regex to catch every such
 * inference is unbounded — enforcing it here, in the schema transform every
 * find_room call passes through, is the only deterministic guarantee.
 */
const NAME_ONLY_FIND_ROOM_PURPOSES: ReadonlySet<FindRoomInput["purpose"]> =
  new Set([TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE, TOOL_PURPOSE.FIND_ROOM.RESOLVE]);

/**
 * Remaps mistaken `name` / relative `date` values so search hits the rooms API.
 *
 * @param input - Raw find_room tool args from the model
 * @param options.today - Optional YYYY-MM-DD for deterministic date resolution in tests
 * @returns Filters safe to send to the rooms API
 */
export const normalizeFindRoomInput = (
  input: FindRoomInput,
  options?: { today?: string },
): FindRoomInput => {
  if (NAME_ONLY_FIND_ROOM_PURPOSES.has(input.purpose)) {
    const rawName = input.name?.trim();
    let statedDate = sanitizeFindRoomDate(input.date, options?.today);
    if (!statedDate && rawName) {
      statedDate = sanitizeFindRoomDate(rawName, options?.today);
    }

    return {
      purpose: input.purpose,
      name: sanitizeFindRoomName(rawName),
      // Stated hints only — the tool never sends these to findRooms/the rooms
      // API as filters for a named-room lookup (see NAME_ONLY_FIND_ROOM_PURPOSES
      // above). Echoed on the output so the BOOK step machine can deterministically
      // decide whether check-in + guests are already known, instead of trusting
      // the model to re-read the latest message correctly a step later — and
      // (book_resolve + 1 match) they seed findRoomTool's own availability probe,
      // a separate /bookings/availability call, so the CREATE flow no longer
      // needs a check_room_availability tool call.
      ...(statedDate ? { date: statedDate } : {}),
      ...(input.guests ? { guests: input.guests } : {}),
    };
  }

  const rawName = input.name?.trim();
  // Recover date cues the model stuffed into `name` before filler stripping
  // removes ordinals ("show available room at 16th" → date=YYYY-MM-DD).
  let date = sanitizeFindRoomDate(input.date, options?.today);
  if (!date && rawName) {
    date = sanitizeFindRoomDate(rawName, options?.today);
  }

  if (!rawName) {
    return date === input.date ? input : { ...input, date };
  }

  const wasCategory = isRoomLevelCategoryName(rawName);
  const name = sanitizeFindRoomName(rawName);

  if (
    name === rawName &&
    date === input.date &&
    !wasCategory &&
    !isCalendarOnlyRoomName(rawName)
  ) {
    return input;
  }

  return {
    ...input,
    name,
    date,
    ...(wasCategory ? { level: input.level ?? LUXURY_ROOM_LEVEL } : {}),
  };
};

/**
 * FIND / RECOMMEND results — the Room List cards the guest sees, and so the
 * only rooms `compare_rooms` may compare (see `resolveCompareCandidates`).
 * `book_resolve` / `resolve` lookups are never compared and must stay ID-only
 * during a booking flow.
 */
export const COMPARE_ELIGIBLE_PURPOSES: ReadonlySet<FindRoomOutput["purpose"]> =
  new Set([
    TOOL_PURPOSE.FIND_ROOM.SEARCH,
    TOOL_PURPOSE.FIND_ROOM.RECOMMEND,
    undefined,
  ]);

/**
 * Hard reply hint when the book_resolve availability probe came back
 * unavailable — mirrors `toCheckRoomAvailabilityModelOutput`'s
 * BookingUnavailable branch. The card (rendered from the raw result) owns every
 * detail, so the model gets no dates/guests/room facts to leak into chat.
 */
const BOOK_RESOLVE_UNAVAILABLE_REPLY_HINT =
  'BookingUnavailable Generic UI is already rendered and the turn is stopping. Reply with exactly ONE very short sentence in the guest\'s language offering to help with other dates or another room. Do NOT repeat the room name, reason, capacity, dates, guests, or any availability value — the card shows them. English example: "I can help you find other dates or another room."';

/**
 * Model payload for find_room.
 *
 * FIND / RECOMMEND: `{ id, name }` per room — just enough to map "compare
 * Moonlight and Bamboo" / "the first two" onto `compare_rooms.roomIds`. No
 * prices, capacities or amenities: `compare_rooms` reads those from the raw
 * result itself, and the UI renders full cards from it, so the model never
 * holds a room fact it could leak into chat text.
 *
 * book_resolve / resolve: IDs only, so an internal lookup can never surface
 * names mid-booking.
 */
export const toFindRoomModelOutput = (output: FindRoomOutput) => {
  const matchCount = output.rooms.length;
  const includeRoomNames = COMPARE_ELIGIBLE_PURPOSES.has(output.purpose);

  const probe = output.availability;
  const probeUnavailable =
    probe && (probe.available === false || probe.guestsWithinCapacity === false);

  // book_resolve probe says taken / over capacity: the step machine stops the
  // turn and FindRoomNotice renders BookingUnavailable. Give the model a slim
  // payload + strict hint so it emits one minimal sentence, not a re-statement.
  if (probeUnavailable) {
    return {
      type: "json" as const,
      value: {
        matchCount,
        purpose: output.purpose,
        availability: {
          available: probe.available,
          guestsWithinCapacity: probe.guestsWithinCapacity,
        },
        replyHint: BOOK_RESOLVE_UNAVAILABLE_REPLY_HINT,
      },
    };
  }

  return {
    type: "json" as const,
    value: {
      matchCount,
      name: output.name,
      date: output.date,
      guests: output.guests,
      level: output.level,
      purpose: output.purpose,
      rooms: output.rooms.map((room) =>
        includeRoomNames ? { id: room.id, name: room.name } : { id: room.id },
      ),
      // book_resolve + 1 match, room free: the CREATE flow reads these
      // dates/guests into confirm_booking instead of calling
      // check_room_availability.
      ...(probe
        ? {
            availability: {
              available: probe.available,
              guestsWithinCapacity: probe.guestsWithinCapacity,
              checkInDate: probe.checkInDate,
              checkOutDate: probe.checkOutDate,
              guests: probe.guests,
            },
          }
        : {}),
      replyHint: buildFindRoomReplyHint(matchCount, output.purpose),
    },
  };
};

type GetRoomByIdInput = {
  roomId: string;
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
};

type RoomStay = {
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
};

/**
 * Resolve booking-form stay values from the current tool input
 * and the previous booking-form continuity hint.
 *
 * Explicit values from the current input always take precedence.
 */
export const resolveRoomStay = (
  input: GetRoomByIdInput,
  requestContext: Parameters<typeof readBookingFormStayHint>[0],
  room: GetRoomDetailOutput["room"],
): RoomStay => {
  const {
    checkInDate,
    checkOutDate,
    guests: statedGuests,
  } = input;

  const continuityHint = checkInDate
    ? null
    : readBookingFormStayHint(requestContext);

  clearBookingFormStayHint(requestContext);

  const resolvedCheckIn =
    checkInDate ?? continuityHint?.checkInDate;

  const resolvedCheckOut = checkInDate
    ? checkOutDate ?? addDaysYmd(checkInDate, 1)
    : continuityHint?.checkOutDate;

  const rawGuests =
    statedGuests ?? continuityHint?.guests;

  const guests = rawGuests
    ? Math.min(Math.max(1, rawGuests), room.capacity)
    : undefined;

  return {
    ...(resolvedCheckIn && resolvedCheckOut
      ? {
          checkInDate: resolvedCheckIn,
          checkOutDate: resolvedCheckOut,
        }
      : {}),

    ...(guests
      ? {
          guests,
        }
      : {}),
  };
};

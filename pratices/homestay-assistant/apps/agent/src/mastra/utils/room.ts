import { TOOL_PURPOSE } from "@repo/constants";
import { LUXURY_ROOM_LEVEL } from "@/mastra/constants";
import type { FindRoomInput } from "@repo/schemas";
import type { FindRoomOutput, GetRoomDetailOutput } from "@/mastra/schemas/rooms";
import { buildFindRoomReplyHint } from "./generic-ui-reply-hints";
import { sanitizeFindRoomDate } from "./sanitize-find-room-date";
import {
  isCalendarOnlyRoomName,
  isRoomLevelCategoryName,
  sanitizeFindRoomName,
} from "./sanitize-find-room-name";
import { clearBookingFormStayHint, readBookingFormStayHint } from "../booking";
import { addDaysYmd } from "@repo/utils";

export {
  isCalendarOnlyRoomName,
  isRoomLevelCategoryName,
  residualRoomName,
  sanitizeFindRoomName,
} from "./sanitize-find-room-name";

export { sanitizeFindRoomDate } from "./sanitize-find-room-date";
export { buildFindRoomReplyHint } from "./generic-ui-reply-hints";

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
      // the model to re-read the latest message correctly a step later.
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
 * Slim payload for the model: keep ids for tool chaining, strip rich fields
 * so the LLM cannot dump descriptions/images that duplicate ListRoomPreview.
 */
export const toFindRoomModelOutput = (output: FindRoomOutput) => {
  const matchCount = output.rooms.length;

  return {
    type: "json" as const,
    value: {
      matchCount,
      name: output.name,
      date: output.date,
      guests: output.guests,
      level: output.level,
      purpose: output.purpose,
      // IDs only — names are intentionally omitted so the model cannot list
      // them in chat text; the UI renders full room cards from the raw result.
      rooms: output.rooms.map((room) => ({ id: room.id })),
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

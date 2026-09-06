import { TOOL_KEYS, TOOL_PURPOSE } from "@repo/constants";

import { stepContractEval } from "../../support/step-contract";

/**
 * `find_room` — every result shape → step-machine transition outcome, no LLM.
 *
 * `find_room` is the only discovery tool the booking step machine reacts to,
 * and only through the `book_resolve` purpose with exactly one match. This file
 * owns the whole `find_room` junction:
 *   - search / recommend / internal resolve, or book_resolve with 0 or 2+
 *     matches → no forced step (the model responds freely)
 *   - book_resolve · 1 match → the platform forces exactly ONE of
 *     `check_room_availability` (stay fully known) or `get_room_by_id` (Booking
 *     Form) — never both, never neither
 *
 * Downstream of that forced `check_room_availability` is covered in
 * `check-room-availability.eval.ts`; `homestay-assistant/behavioral/find-room.eval.ts`
 * proves a real model reaches these same outcomes end-to-end.
 */
stepContractEval("find_room — discovery never forces a booking step", [
  {
    name: "search → no forced step",
    last: {
      toolName: TOOL_KEYS.GET.FIND_ROOM,
      input: { purpose: TOOL_PURPOSE.FIND_ROOM.SEARCH },
      output: {
        rooms: [{ id: "room-riverside-twin" }, { id: "room-bamboo-family-suite" }],
        purpose: TOOL_PURPOSE.FIND_ROOM.SEARCH,
      },
    },
    expected: "pass",
  },
  {
    name: "recommend → no forced step",
    last: {
      toolName: TOOL_KEYS.GET.FIND_ROOM,
      input: { purpose: TOOL_PURPOSE.FIND_ROOM.RECOMMEND },
      output: {
        rooms: [{ id: "room-riverside-twin" }],
        purpose: TOOL_PURPOSE.FIND_ROOM.RECOMMEND,
      },
    },
    expected: "pass",
  },
  {
    name: "resolve (internal name → id lookup) → no forced step",
    last: {
      toolName: TOOL_KEYS.GET.FIND_ROOM,
      input: { purpose: TOOL_PURPOSE.FIND_ROOM.RESOLVE },
      output: {
        rooms: [{ id: "room-riverside-twin" }],
        purpose: TOOL_PURPOSE.FIND_ROOM.RESOLVE,
      },
    },
    expected: "pass",
  },
  {
    name: "book_resolve · 0 matches → no forced step (nothing to book)",
    last: {
      toolName: TOOL_KEYS.GET.FIND_ROOM,
      input: { purpose: TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE },
      output: { rooms: [], purpose: TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE },
    },
    expected: "pass",
  },
  {
    name: "book_resolve · 2+ matches → no forced step (ambiguous room name)",
    last: {
      toolName: TOOL_KEYS.GET.FIND_ROOM,
      input: { purpose: TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE },
      output: {
        rooms: [{ id: "room-riverside-twin" }, { id: "room-bamboo-family-suite" }],
        purpose: TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE,
      },
    },
    expected: "pass",
  },
]);

/**
 * `find_room(book_resolve)` · exactly one match — the CREATE-flow fork. Routes
 * on whether check-in date AND guest count are both already known, corroborated
 * against the guest's own latest message (`resolveCorroboratedBookFacts` /
 * `book-form-prefill.ts`): an echoed value with no matching cue in the latest
 * text is treated as unstated and the Booking Form opens anyway.
 */
stepContractEval("find_room(book_resolve) — CREATE fork: form vs availability", [
  {
    name: "1 room · check-in + guests stated this turn → skip the form, force availability",
    last: {
      toolName: TOOL_KEYS.GET.FIND_ROOM,
      input: { purpose: TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE },
      output: {
        rooms: [{ id: "room-riverside-twin" }],
        date: "2026-10-22",
        guests: 2,
        purpose: TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE,
      },
    },
    latestUserText: "Book the Riverside Twin Room for 2 guests on October 22",
    expected: `force:${TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY}`,
  },
  {
    name: "1 room · no stay stated → force the Booking Form (get_room_by_id)",
    last: {
      toolName: TOOL_KEYS.GET.FIND_ROOM,
      input: { purpose: TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE },
      output: {
        rooms: [{ id: "room-riverside-twin" }],
        purpose: TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE,
      },
    },
    expected: `force:${TOOL_KEYS.BOOKING.GET_ROOM_BY_ID}`,
  },
  {
    name: "1 room · guests stated but no check-in → still the form",
    last: {
      toolName: TOOL_KEYS.GET.FIND_ROOM,
      input: { purpose: TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE },
      output: {
        rooms: [{ id: "room-riverside-twin" }],
        guests: 2,
        purpose: TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE,
      },
    },
    latestUserText: "Book the Riverside Twin Room for 2 guests",
    expected: `force:${TOOL_KEYS.BOOKING.GET_ROOM_BY_ID}`,
  },
  {
    name: "1 room · date echoed but absent from the latest message → treat as unstated, force the form",
    last: {
      toolName: TOOL_KEYS.GET.FIND_ROOM,
      input: { purpose: TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE },
      output: {
        rooms: [{ id: "room-riverside-twin" }],
        date: "2026-10-22",
        guests: 2,
        purpose: TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE,
      },
    },
    latestUserText: "Book the Riverside Twin Room",
    expected: `force:${TOOL_KEYS.BOOKING.GET_ROOM_BY_ID}`,
  },
]);

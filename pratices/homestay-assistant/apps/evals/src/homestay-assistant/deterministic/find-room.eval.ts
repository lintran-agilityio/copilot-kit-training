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
 *   - book_resolve · 1 match → the platform forces `confirm_booking` (stay fully
 *     known + probe free), stops (probe taken / over capacity), or forces
 *     `get_room_by_id` (Booking Form, stay not fully known) — never `check_room_availability`
 *
 * CREATE no longer routes through `check_room_availability` — `findRoomTool`
 * probes `/bookings/availability` itself and attaches the verdict as
 * `output.availability`; this file's CREATE-fork cases assert the routing off
 * that. `homestay-assistant/behavioral/find-room.eval.ts` proves a real model
 * reaches these same outcomes end-to-end.
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
 * text is treated as unstated and the Booking Form opens anyway. When both ARE
 * known, `findRoomTool`'s own availability probe (`output.availability`) decides
 * `confirm_booking` vs a stop — CREATE never calls `check_room_availability`.
 */
const AVAILABLE = {
  available: true,
  guestsWithinCapacity: true,
  checkInDate: "2026-10-22",
  checkOutDate: "2026-10-23",
  guests: 2,
};

stepContractEval("find_room(book_resolve) — CREATE fork: form vs confirm", [
  {
    name: "1 room · check-in + guests stated + room free → skip the form, force confirm_booking",
    last: {
      toolName: TOOL_KEYS.GET.FIND_ROOM,
      input: { purpose: TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE },
      output: {
        rooms: [{ id: "room-riverside-twin" }],
        date: "2026-10-22",
        guests: 2,
        purpose: TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE,
        availability: AVAILABLE,
      },
    },
    latestUserText: "Book the Riverside Twin Room for 2 guests on October 22",
    expected: `force:${TOOL_KEYS.ACTION.CONFIRM_BOOKING}`,
  },
  {
    name: "1 room · check-in + guests stated + room taken → stop (BookingUnavailable)",
    last: {
      toolName: TOOL_KEYS.GET.FIND_ROOM,
      input: { purpose: TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE },
      output: {
        rooms: [{ id: "room-riverside-twin" }],
        date: "2026-10-22",
        guests: 2,
        purpose: TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE,
        availability: { ...AVAILABLE, available: false },
      },
    },
    latestUserText: "Book the Riverside Twin Room for 2 guests on October 22",
    expected: "stop",
  },
  {
    name: "1 room · check-in + guests stated + over capacity → stop (BookingUnavailable)",
    last: {
      toolName: TOOL_KEYS.GET.FIND_ROOM,
      input: { purpose: TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE },
      output: {
        rooms: [{ id: "room-riverside-twin" }],
        date: "2026-10-22",
        guests: 9,
        purpose: TOOL_PURPOSE.FIND_ROOM.BOOK_RESOLVE,
        availability: { ...AVAILABLE, guests: 9, guestsWithinCapacity: false },
      },
    },
    latestUserText: "Book the Riverside Twin Room for 9 guests on October 22",
    expected: "stop",
  },
  {
    name: "1 room · check-in + guests stated + probe absent (call failed) → still force confirm_booking",
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
    expected: `force:${TOOL_KEYS.ACTION.CONFIRM_BOOKING}`,
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

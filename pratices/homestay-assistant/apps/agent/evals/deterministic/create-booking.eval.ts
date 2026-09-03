import { TOOL_KEYS, TOOL_PURPOSE } from "@repo/constants";

import { stepContractEval } from "../support/step-contract";

/**
 * CREATE flow — step-machine forced transitions, no LLM.
 *
 * The model resolves the room via `find_room(book_resolve)`; the step machine
 * then routes on whether the stay is fully known:
 *   full info  → check_room_availability → confirm_booking → create_booking
 *   missing    → get_room_by_id (opens the Booking Form)
 *
 * The `behavioral/` suite proves a real model reaches these same gates
 * end-to-end; this proves the gate logic itself never regresses.
 */
stepContractEval("CREATE booking — step-machine forced transitions", [
  {
    name: "book_resolve · 1 room · check-in + guests stated this turn → skip the form, force availability",
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
    name: "book_resolve · 1 room · no stay stated → force the Booking Form (get_room_by_id)",
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
    name: "book_resolve · 1 room · guests stated but no check-in → still the form",
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
    name: "book_resolve · 1 room · date echoed but absent from the latest message → treat as unstated, force the form",
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
  {
    name: "availability OK (create) → force confirm_booking",
    last: {
      toolName: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
      input: { flow: "create" },
      output: {
        available: true,
        guestsWithinCapacity: true,
        nextAction: "confirm_booking",
        flow: "create",
      },
    },
    expected: `force:${TOOL_KEYS.ACTION.CONFIRM_BOOKING}`,
  },
  {
    name: "availability fails (create) → stop, never confirm",
    last: {
      toolName: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
      input: { flow: "create" },
      output: {
        available: false,
        guestsWithinCapacity: true,
        nextAction: "stop_booking",
        flow: "create",
      },
    },
    expected: "stop",
  },
  {
    name: "guest confirmed the draft → force the terminal create_booking",
    last: {
      toolName: TOOL_KEYS.ACTION.CONFIRM_BOOKING,
      output: { confirmed: true },
    },
    expected: `force:${TOOL_KEYS.BOOKING.CREATE_BOOKING}`,
  },
  {
    name: "guest dismissed the confirm dialog → stop, never mutate",
    last: {
      toolName: TOOL_KEYS.ACTION.CONFIRM_BOOKING,
      output: { confirmed: false },
    },
    expected: "stop",
  },
  {
    name: "create_booking returned → stop (turn is done)",
    last: {
      toolName: TOOL_KEYS.BOOKING.CREATE_BOOKING,
      output: { id: "booking-new", status: "confirmed" },
    },
    expected: "stop",
  },
]);

import { TOOL_KEYS, TOOL_PURPOSE } from "@repo/constants";

import { stepContractEval } from "../support/step-contract";

/**
 * FIND ROOM — step-machine contract, no LLM.
 *
 * Room discovery on its own never forces a booking step. Only
 * `find_room(book_resolve)` with exactly one match can force one, and only
 * into the CREATE flow (covered in `create-booking.eval.ts`). Every other
 * find_room shape — search / recommend / internal resolve, or book_resolve
 * with zero or many matches — leaves the model free to respond.
 */
stepContractEval("FIND ROOM — discovery never forces a booking step", [
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

import { evalite } from "evalite";

import { scoreResult } from "../../support/checks";
import { runCase, type CaseResult } from "../../support/run-case";
import { FIXTURE_ROOMS } from "../../support/fixtures";

/**
 * `get_room_by_id` — real LLM agent turns, structured scoring.
 *
 * `get_room_by_id` fetches one room by id. It is reached three ways
 * (`WORKFLOW_DETAIL` / `WORKFLOW_BOOK` / `PRIORITY_TRIGGERS`):
 *   - detail intent + name only → `find_room` → (1 match) → `get_room_by_id`
 *   - `[book-form]` / `roomId:` with no dates → `get_room_by_id` only, and
 *     NEVER `check_room_availability` on that turn
 *   - the step machine forces it to open the Booking Form after
 *     `find_room(book_resolve)` with a partial stay (covered in
 *     `deterministic/find-room.eval.ts`)
 *
 * ⚠️ Two cases below are KNOWN-FAILING, left failing on purpose — a real,
 * currently-unfixed production behavior gap this suite discovered, NOT an eval
 * bug. `WORKFLOW_DETAIL` documents `find_room` → (exactly one match) →
 * `get_room_by_id` for a bare "tell me about <room>" / "what amenities does
 * <room> have" request; live runs call `find_room` and stop, and the amenities
 * reply lists amenities in chat (which `WORKFLOW_FIND`/`WORKFLOW_DETAIL` forbid
 * — "UI owns the data"). Do NOT loosen these assertions to make them pass;
 * fixing the chain is a prompt change outside this suite's scope.
 */
const RIVERSIDE = FIXTURE_ROOMS[1]!; // room-riverside-twin

type DetailCase = {
  name: string;
  message: string;
  mustCallInOrder: string[];
  mustNotCall: string[];
  knownFailing?: boolean;
};

const cases: DetailCase[] = [
  {
    name: "create — named room, no dates/guests → find_room then get_room_by_id (Booking Form), no availability",
    message: "I want to book the Riverside Twin Room",
    mustCallInOrder: ["find_room", "get_room_by_id"],
    mustNotCall: ["check_room_availability", "confirm_booking", "create_booking"],
  },
  {
    name: "detail — 'tell me about <room>' completes find_room → get_room_by_id (KNOWN FAILING)",
    message: "Tell me about the Bamboo Family Suite",
    mustCallInOrder: ["find_room", "get_room_by_id"],
    mustNotCall: [],
    knownFailing: true,
  },
  {
    name: "detail — amenities question completes find_room → get_room_by_id (KNOWN FAILING)",
    message: "What amenities does the Riverside Twin Room have?",
    mustCallInOrder: ["find_room", "get_room_by_id"],
    mustNotCall: [],
    knownFailing: true,
  },
  {
    name: "[book-form] roomId → get_room_by_id only, never check_room_availability",
    message: `[book-form]\nroomId: ${RIVERSIDE.id}`,
    mustCallInOrder: ["get_room_by_id"],
    mustNotCall: ["find_room", "check_room_availability", "confirm_booking"],
  },
];

evalite<DetailCase, CaseResult, DetailCase>("get_room_by_id — detail & book-form routing", {
  data: () => cases.map((c) => ({ input: c, expected: c })),
  task: (input) => runCase(input.message),
  scorers: [
    {
      name: "Called required tools in order",
      description:
        "Every tool in mustCallInOrder appears in that relative order (other tools may interleave).",
      scorer: ({ output, expected }) => {
        const names = output.toolNames;
        let cursor = -1;
        for (const tool of expected!.mustCallInOrder) {
          const index = names.indexOf(tool, cursor + 1);
          if (index === -1) {
            return scoreResult(
              false,
              `${expected!.knownFailing ? "[KNOWN FAILING] " : ""}missing or out-of-order "${tool}" — got [${names.join(", ") || "none"}]`,
            );
          }
          cursor = index;
        }
        return scoreResult(true, `saw expected order in [${names.join(", ")}]`);
      },
    },
    {
      name: "Never called a forbidden tool",
      scorer: ({ output, expected }) => {
        const hit = expected!.mustNotCall.filter((t) =>
          output.toolNames.includes(t),
        );
        return scoreResult(
          hit.length === 0,
          hit.length === 0 ? "no forbidden tool calls" : `unexpectedly called [${hit.join(", ")}]`,
        );
      },
    },
  ],
  columns: ({ input, output }) => [
    { label: "Message", value: input.message },
    { label: "Tool calls", value: output.toolNames.join(" → ") || "(none)" },
  ],
});

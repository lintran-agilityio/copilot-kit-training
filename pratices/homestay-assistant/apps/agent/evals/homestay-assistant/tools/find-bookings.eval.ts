import { evalite } from "evalite";

import { scoreResult } from "../../support/checks";
import { runCase, type CaseResult } from "../../support/run-case";

/**
 * `find_bookings` — real LLM agent turns, structured scoring.
 *
 * `find_bookings` is the INTERNAL cancel/modify/change-room target resolver
 * (never the guest-facing list — that's `get_bookings`). For a modify/cancel
 * request with no `bookingId:` and a room named, it must be the FIRST tool,
 * with the room name passed as-is — `find_room` is never used to look up a
 * roomId first (CORE_PRINCIPLES: "Modify/Cancel intent ≠ FIND workflow").
 *
 * `status: "not_found"` is a hard stop: the agent says there are no active
 * bookings and calls no HITL/mutation tool — it must not invent a booking.
 * (`resolved`/`ambiguous` continuations are proven in
 * `behavioral/find-booking-by-id.eval.ts` and `behavioral/cancel-booking.eval.ts`.)
 */
type FindBookingsCase = {
  name: string;
  message: string;
  mustCallInOrder: string[];
  mustNotCall: string[];
};

// Kept the not_found hard-stop case: it exercises find_bookings-first
// routing (never find_room) AND that a no-match resolver result invents
// nothing. The modify→find_booking_by_id continuation is covered in
// tools/find-booking-by-id.eval.ts and conversation/booking-hitl-flow.eval.ts.
const cases: FindBookingsCase[] = [
  {
    name: "cancel a room with no booking → find_bookings runs, no dialog, no mutation",
    message: "Cancel my Lotus Single Room booking",
    mustCallInOrder: ["find_bookings"],
    mustNotCall: [
      "find_room",
      "find_booking_by_id",
      "show_cancel_dialog_confirm",
      "cancel_booking",
    ],
  },
];

evalite<FindBookingsCase, CaseResult, FindBookingsCase>(
  "find_bookings — internal resolver, never find_room; not_found is a hard stop",
  {
    data: () => cases.map((c) => ({ input: c, expected: c })),
    task: (input) => runCase(input.message),
    scorers: [
      {
        name: "Called required tools in order",
        scorer: ({ output, expected }) => {
          const names = output.toolNames;
          let cursor = -1;
          for (const tool of expected!.mustCallInOrder) {
            const index = names.indexOf(tool, cursor + 1);
            if (index === -1) {
              return scoreResult(
                false,
                `missing or out-of-order "${tool}" — got [${names.join(", ") || "none"}]`,
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
            hit.length === 0
              ? "no forbidden tool calls"
              : `unexpectedly called [${hit.join(", ")}] — got [${output.toolNames.join(", ")}]`,
          );
        },
      },
    ],
    columns: ({ input, output }) => [
      { label: "Message", value: input.message },
      { label: "Reply", value: output.text.slice(0, 160) },
      { label: "Tool calls", value: output.toolNames.join(" → ") || "(none)" },
    ],
  },
);

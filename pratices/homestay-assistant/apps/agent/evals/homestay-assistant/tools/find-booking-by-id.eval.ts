import { evalite } from "evalite";
import { addDaysYmd } from "@repo/utils/date";

import { diffArgs, scoreResult } from "../../support/checks";
import { toolCallArgs } from "../../support/tool-calls";
import { runCase, type CaseResult } from "../../support/run-case";
import { FIXTURE_EXISTING_BOOKING } from "../../support/fixtures";

/**
 * `find_booking_by_id` — real LLM agent turns, structured scoring.
 *
 * `find_booking_by_id` looks up one booking by id for CANCEL or MODIFY. Two
 * concerns:
 *   1. MODIFY stated-change extraction — when the guest's latest message states
 *      a new value (including "extend N nights", which the model must compute
 *      into a date itself — there is no date-math tool), it goes on the
 *      `requestedCheckInDate`/`requestedCheckOutDate`/`requestedGuests` args;
 *      fields the guest left alone stay unset (never fabricated). This is what
 *      lets the step machine skip the edit form.
 *   2. `[booking-cancel] bookingId:` priority trigger — `find_booking_by_id`
 *      then `show_cancel_dialog_confirm` in the SAME turn, with NO
 *      `find_bookings` first (the id is already known).
 *
 * The no-LLM junction (`find_booking_by_id(modify)` → form vs availability) is
 * in `deterministic/find-booking-by-id.eval.ts`.
 */

// --- MODIFY stated-change extraction ----------------------------------
evalite<{ name: string; message: string }, CaseResult, Record<string, unknown>>(
  "find_booking_by_id — 'extend N nights' computes the date, leaves other fields unset",
  {
    data: () => [
      {
        input: {
          name: "extend 2 nights — compute requestedCheckOutDate, don't ask",
          message: "Extend my Riverside Twin Room booking by 2 nights",
        },
        expected: {
          requestedCheckOutDate: addDaysYmd(
            FIXTURE_EXISTING_BOOKING.checkOutDate,
            2,
          ),
          requestedCheckInDate: undefined,
          requestedGuests: undefined,
        },
      },
    ],
    task: (input) => runCase(input.message),
    scorers: [
      {
        name: "only the stated field changes; others stay unset",
        scorer: ({ output, expected }) => {
          const args = toolCallArgs(output.toolCalls, "find_booking_by_id");
          if (!args) {
            return scoreResult(false, "find_booking_by_id was never called");
          }
          const mismatches = diffArgs(args, expected!);
          return scoreResult(
            mismatches.length === 0,
            mismatches.length === 0
              ? `matched: ${JSON.stringify(args)}`
              : `mismatched fields ${JSON.stringify(mismatches)} — full args: ${JSON.stringify(args)}`,
          );
        },
      },
    ],
    columns: ({ input, output }) => [
      { label: "Message", value: input.message },
      {
        label: "find_booking_by_id args",
        value: JSON.stringify(
          toolCallArgs(output.toolCalls, "find_booking_by_id") ?? {},
        ),
      },
    ],
  },
);

// --- [booking-cancel] priority trigger --------------------------------
evalite<{ message: string }, CaseResult, string[]>(
  "find_booking_by_id — [booking-cancel] resolves by id then opens the cancel dialog",
  {
    data: () => [
      {
        input: {
          message: `[booking-cancel]\nbookingId: ${FIXTURE_EXISTING_BOOKING.id}`,
        },
        expected: ["find_booking_by_id", "show_cancel_dialog_confirm"],
      },
    ],
    task: (input) => runCase(input.message),
    scorers: [
      {
        name: "find_booking_by_id → show_cancel_dialog_confirm, in order",
        scorer: ({ output, expected }) => {
          const names = output.toolNames;
          const a = names.indexOf(expected![0]!);
          const b = names.indexOf(expected![1]!, a + 1);
          return scoreResult(
            a !== -1 && b !== -1,
            `expected [${expected!.join(" → ")}], got [${names.join(", ") || "none"}]`,
          );
        },
      },
      {
        name: "Did not resolve via find_bookings (id was already known)",
        scorer: ({ output }) =>
          scoreResult(
            !output.toolNames.includes("find_bookings"),
            `tool calls: [${output.toolNames.join(", ") || "none"}]`,
          ),
      },
    ],
    columns: ({ output }) => [
      { label: "Tool calls", value: output.toolNames.join(" → ") || "(none)" },
    ],
  },
);

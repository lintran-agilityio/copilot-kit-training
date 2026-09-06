import { evalite } from "evalite";
import { addDaysYmd, formatTodayYmd } from "@repo/utils/date";

import { diffArgs, scoreResult } from "../../support/checks";
import { toolCallArgs } from "../../support/tool-calls";
import { runCase, type CaseResult } from "../../support/run-case";

/**
 * `check_room_availability` — real LLM agent turns, structured scoring.
 *
 * This tool is the availability gate for both CREATE (`flow=create`, no
 * `excludeBookingId`) and MODIFY (`flow=modify` + `excludeBookingId`). It is
 * often a step-machine-forced call, so what the model emits as arguments is
 * what this file checks — the routing OFF its result is proven without an LLM
 * in `deterministic/check-room-availability.eval.ts`.
 *
 * Concerns:
 *   1. CREATE full-info — a named room with a complete stay stated in chat
 *      skips the Booking Form; the forced availability call must carry exactly
 *      the guest's stated roomId/dates/guests and `flow: "create"` — no
 *      invented or stale values.
 *   2. MODIFY — a stated-change modify must never run availability with
 *      `flow: "create"` (that would create a second booking).
 */
const tomorrow = addDaysYmd(formatTodayYmd(), 1);

type CreateArgCase = { name: string; message: string; expected: Record<string, unknown> };

const createCases: CreateArgCase[] = [
  {
    name: "named room + explicit guests + tomorrow, one night",
    message:
      "I want to book the Riverside Twin Room for 2 guests tomorrow, one night",
    expected: {
      roomId: "room-riverside-twin",
      checkInDate: tomorrow,
      checkOutDate: addDaysYmd(tomorrow, 1),
      guests: 2,
      flow: "create",
    },
  },
];

evalite<CreateArgCase, CaseResult, Record<string, unknown>>(
  "check_room_availability — CREATE args match the stated stay exactly",
  {
    data: () => createCases.map((c) => ({ input: c, expected: c.expected })),
    task: (input) => runCase(input.message),
    scorers: [
      {
        name: "availability args match request exactly",
        description:
          "roomId/checkInDate/checkOutDate/guests/flow must match what the guest asked for — no invented or stale values.",
        scorer: ({ output, expected }) => {
          const args = toolCallArgs(output.toolCalls, "check_room_availability");
          if (!args) {
            return scoreResult(false, "check_room_availability was never called");
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
        label: "check_room_availability args",
        value: JSON.stringify(
          toolCallArgs(output.toolCalls, "check_room_availability") ?? {},
        ),
      },
    ],
  },
);

evalite<{ message: string }, CaseResult, "modify">(
  "check_room_availability — MODIFY never runs with flow=create",
  {
    data: () => [
      {
        input: {
          message:
            "Change my Riverside Twin Room booking to check in November 1 and check out November 3",
        },
        expected: "modify",
      },
    ],
    task: (input) => runCase(input.message),
    scorers: [
      {
        name: "availability ran and was not flow=create",
        description:
          "A modify turn must resolve the booking then check availability with flow=modify (+ excludeBookingId) — never flow=create, which would double-book.",
        scorer: ({ output }) => {
          const args = toolCallArgs(output.toolCalls, "check_room_availability");
          if (!args) {
            return scoreResult(
              false,
              `check_room_availability never ran — tool calls: [${output.toolNames.join(", ") || "none"}]`,
            );
          }
          return scoreResult(
            args.flow !== "create",
            `flow=${JSON.stringify(args.flow)}, excludeBookingId=${JSON.stringify(args.excludeBookingId)} — full args: ${JSON.stringify(args)}`,
          );
        },
      },
    ],
    columns: ({ output }) => [
      { label: "Tool calls", value: output.toolNames.join(" → ") || "(none)" },
      {
        label: "check_room_availability args",
        value: JSON.stringify(
          toolCallArgs(output.toolCalls, "check_room_availability") ?? {},
        ),
      },
    ],
  },
);

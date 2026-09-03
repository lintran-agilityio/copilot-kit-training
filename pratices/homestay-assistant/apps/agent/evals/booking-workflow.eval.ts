import { evalite } from "evalite";

import { scoreResult } from "./support/checks";
import { runCase, type CaseResult } from "./support/run-case";

/**
 * Booking-workflow ordering: proves the terminal mutation tool
 * (`create_booking` / `update_booking` / `cancel_booking`) never fires
 * without the resolve → availability → confirm sequence in front of it —
 * this is the property the whole HITL design exists to guarantee (see
 * `src/mastra/booking/step-machine.ts` `CONFIRMATION_FOLLOW_UPS` /
 * `TERMINAL_TOOLS`). Because the confirm tools are frontend-rendered HITL
 * calls (`confirm_booking`, `confirm_modify_booking`,
 * `show_cancel_dialog_confirm`) the agent turn naturally ends once one of
 * them is called and awaits a real UI click — so asserting "the terminal
 * tool never appears in this single turn" is the correct, complete
 * assertion; it does not require simulating the resumed round-trip.
 */
type WorkflowCase = {
  name: string;
  message: string;
  mustAppearInOrder: string[];
  terminalTool: string;
};

const cases: WorkflowCase[] = [
  {
    name: "create — full info, available room, stops at confirm_booking",
    message:
      "Book the Riverside Twin Room for 2 guests on October 22, one night",
    mustAppearInOrder: ["find_room", "check_room_availability", "confirm_booking"],
    terminalTool: "create_booking",
  },
  {
    name: "modify — stated date change, available, stops at confirm_modify_booking",
    message:
      "Change my Riverside Twin Room booking to check in November 1 and check out November 3",
    mustAppearInOrder: [
      "find_bookings",
      "find_booking_by_id",
      "check_room_availability",
      "confirm_modify_booking",
    ],
    terminalTool: "update_booking",
  },
  {
    name: "cancel — resolves by name, stops at show_cancel_dialog_confirm",
    message: "Please cancel my booking for the Riverside Twin Room",
    mustAppearInOrder: ["find_bookings", "show_cancel_dialog_confirm"],
    terminalTool: "cancel_booking",
  },
];

evalite<WorkflowCase, CaseResult, WorkflowCase>(
  "Booking workflow — never mutates before confirmation",
  {
    data: () => cases.map((c) => ({ input: c, expected: c })),
    task: (input) => runCase(input.message),
    scorers: [
      {
        name: "Reached the confirm gate in order",
        scorer: ({ output, expected }) => {
          const names = output.toolNames;
          let cursor = -1;
          for (const tool of expected!.mustAppearInOrder) {
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
        name: "Terminal mutation tool never fired this turn",
        description:
          "create_booking/update_booking/cancel_booking must wait for a real HITL click on the NEXT turn, never this one.",
        scorer: ({ output, expected }) =>
          scoreResult(
            !output.toolNames.includes(expected!.terminalTool),
            output.toolNames.includes(expected!.terminalTool)
              ? `"${expected!.terminalTool}" fired without a resumed confirmation — got [${output.toolNames.join(", ")}]`
              : `"${expected!.terminalTool}" correctly withheld`,
          ),
      },
    ],
    columns: ({ input, output }) => [
      { label: "Message", value: input.message },
      { label: "Tool calls", value: output.toolNames.join(" → ") || "(none)" },
    ],
  },
);

/**
 * The specific, previously-discussed workflow bug: a MODIFY whose stated
 * change is a no-op (matches the booking's current stay exactly) must
 * never reach `confirm_modify_booking` — see `WORKFLOW_MODIFY`'s own
 * worked example in intent-playbook.ts ("Change guests to 1 (booking
 * already has 1 guest)") and the deterministic guard proven directly in
 * `deterministic/modify-booking.eval.ts`. This eval proves the *prompt*
 * also honors that guard when a real model drives the turn.
 */
evalite<{ message: string }, CaseResult, string[]>(
  "Booking workflow — no-op modify never opens the confirm dialog",
  {
    data: () => [
      {
        input: {
          message:
            "Change the guest count on my Riverside Twin Room booking to 2",
        },
        // Fixture booking already has guests: 2 — see evals/support/fixtures.ts
        expected: ["confirm_modify_booking", "update_booking"],
      },
    ],
    task: (input) => runCase(input.message),
    scorers: [
      {
        name: "Resolved the booking before judging no-op",
        description:
          "Must still call find_bookings/find_booking_by_id — never judge a no-op from chat history alone.",
        scorer: ({ output }) =>
          scoreResult(
            output.toolNames.includes("find_bookings") &&
              output.toolNames.includes("find_booking_by_id"),
            `tool calls: [${output.toolNames.join(", ") || "none"}]`,
          ),
      },
      {
        name: "Never opened confirm_modify_booking or update_booking",
        scorer: ({ output, expected }) => {
          const forbidden = expected!.filter((tool) =>
            output.toolNames.includes(tool),
          );
          return scoreResult(
            forbidden.length === 0,
            forbidden.length === 0
              ? "correctly stopped without a confirm dialog"
              : `unexpectedly called [${forbidden.join(", ")}]`,
          );
        },
      },
    ],
    columns: ({ output }) => [
      { label: "Reply", value: output.text.slice(0, 200) },
      { label: "Tool calls", value: output.toolNames.join(" → ") || "(none)" },
    ],
  },
);

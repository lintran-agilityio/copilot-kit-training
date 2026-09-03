import { evalite } from "evalite";

import { scoreResult } from "./support/checks";
import { runCase, type CaseResult } from "./support/run-case";

/**
 * Tool selection for intents that resolve through more than one tool call
 * — CREATE / MODIFY / CANCEL never resolve to a single call the way
 * search/list do, so "tool selection" here means asserting the resolver
 * tool that must run FIRST, plus which mutation-adjacent tools must (or
 * must not) appear this turn. Sequencing/ordering across the full confirm
 * gate is covered in depth by `booking-workflow.eval.ts`; this file is
 * about "did it reach for the right tool(s)", not "did it stop at the
 * right gate".
 *
 * Note: the COMPARE workflow (`generate_a2ui`) is a CopilotKit-side
 * generative-UI tool injected by the AG-UI bridge, not a tool registered on
 * the Mastra agent itself — it isn't reachable from a direct
 * `agent.generate()` call, so it's out of scope here (see README "Known
 * limitations").
 *
 * ⚠️ The "room detail by name" case below is a KNOWN-FAILING regression,
 * left failing on purpose — see README "Known limitations / open findings".
 * `WORKFLOW_DETAIL` documents `find_room` → (exactly one match) →
 * `get_room_by_id` for a bare name+detail request, but the live agent was
 * observed stopping after `find_room` and not completing the chain. This is
 * a real, currently-unfixed production behavior gap discovered by this
 * suite, not a bug in the eval — do not "fix" it by loosening the
 * assertion.
 */
type ToolSelectionCase = {
  name: string;
  message: string;
  mustCallInOrder: string[];
  mustNotCall: string[];
};

const cases: ToolSelectionCase[] = [
  {
    name: "create — named room, no dates/guests (partial info opens the form)",
    message: "I want to book the Riverside Twin Room",
    mustCallInOrder: ["find_room", "get_room_by_id"],
    mustNotCall: ["check_room_availability", "confirm_booking", "create_booking"],
  },
  {
    name: "create — named room with full stay stated (skips the form)",
    message:
      "I want to book the Riverside Twin Room for 2 guests on October 20, one night",
    mustCallInOrder: ["find_room", "check_room_availability", "confirm_booking"],
    mustNotCall: ["get_room_by_id", "create_booking"],
  },
  {
    name: "modify — no bookingId, room named, resolves via find_bookings",
    message:
      "I'd like to change the check-out date on my Riverside Twin Room booking to November 3",
    mustCallInOrder: ["find_bookings", "find_booking_by_id"],
    mustNotCall: ["find_room", "update_booking"],
  },
  {
    name: "cancel — no bookingId, room named, resolves via find_bookings",
    message: "Cancel my Riverside Twin Room booking",
    mustCallInOrder: ["find_bookings", "show_cancel_dialog_confirm"],
    mustNotCall: ["find_room", "find_booking_by_id", "cancel_booking"],
  },
  {
    name: "room detail by name — should complete find_room → get_room_by_id (KNOWN FAILING, see file header)",
    message: "Tell me about the Bamboo Family Suite",
    mustCallInOrder: ["find_room", "get_room_by_id"],
    mustNotCall: [],
  },
];

evalite<ToolSelectionCase, CaseResult, ToolSelectionCase>(
  "Tool selection — booking intents",
  {
    data: () => cases.map((c) => ({ input: c, expected: c })),
    task: (input) => runCase(input.message),
    scorers: [
      {
        name: "Called required tools in order",
        description:
          "Every tool in mustCallInOrder must appear, in that relative order (other tools may appear between/after them).",
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
        description:
          "Mutation/off-path tools that would skip a resolution or confirmation step.",
        scorer: ({ output, expected }) => {
          const forbidden = expected!.mustNotCall.filter((tool) =>
            output.toolNames.includes(tool),
          );
          return scoreResult(
            forbidden.length === 0,
            forbidden.length === 0
              ? "no forbidden tool calls"
              : `unexpectedly called [${forbidden.join(", ")}]`,
          );
        },
      },
    ],
    columns: ({ input, output }) => [
      { label: "Message", value: input.message },
      { label: "Tool calls", value: output.toolNames.join(" → ") || "(none)" },
    ],
  },
);

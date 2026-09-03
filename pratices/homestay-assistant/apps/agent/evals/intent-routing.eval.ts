import { evalite } from "evalite";

import { scoreResult } from "./support/checks";
import { runCase, type CaseResult } from "./support/run-case";

/**
 * Intent recognition, expressed as a structured assertion: for this agent,
 * the intent IS the tool it dispatches to first (see
 * `src/mastra/constants/prompts/intent-playbook.ts` §TOOL_DISPATCH /
 * §ROUTING_RULES) — there is no separate "intent" field to compare against,
 * so asserting the first tool call is the deterministic equivalent of
 * checking intent classification. Utterances are drawn from the brief's
 * examples plus the playbook's own documented trigger phrasing.
 */
type IntentCase = {
  name: string;
  message: string;
  expectedFirstTool: string;
};

const cases: IntentCase[] = [
  {
    name: "search — guests + explicit date",
    message: "Find me a room for 2 guests on October 10",
    expectedFirstTool: "find_room",
  },
  {
    name: "search — 'available' wording, no name",
    message: "What rooms are available for two people?",
    expectedFirstTool: "find_room",
  },
  {
    name: "search — explicit date range",
    message: "Show available rooms from October 10 to October 12",
    expectedFirstTool: "find_room",
  },
  {
    name: "search — relative weekend phrasing",
    message: "Do you have anything available this weekend?",
    expectedFirstTool: "find_room",
  },
  {
    name: "list bookings — 'show my bookings'",
    message: "Show my bookings",
    expectedFirstTool: "get_bookings",
  },
  {
    name: "list bookings — 'what bookings do I have'",
    message: "What bookings do I have?",
    expectedFirstTool: "get_bookings",
  },
  {
    name: "list bookings — 'show my reservations'",
    message: "Show my reservations",
    expectedFirstTool: "get_bookings",
  },
  {
    // Per WORKFLOW_DETAIL ("If name + detail cues (no search verbs, no
    // roomId:) → find_room ... → exactly one match → get_room_by_id"), a
    // bare name+detail request resolves through find_room FIRST — it is
    // NOT a direct get_room_by_id call (there is no roomId yet). The full
    // two-step chain is asserted in tool-selection.eval.ts; this file only
    // checks the documented first tool.
    name: "room detail — named room",
    message: "Tell me about the Bamboo Family Suite",
    expectedFirstTool: "find_room",
  },
  {
    name: "room detail — amenities question",
    message: "What amenities does the Riverside Twin Room have?",
    expectedFirstTool: "find_room",
  },
  {
    name: "browse — no filters at all",
    message: "Show me all the rooms you have",
    expectedFirstTool: "get_rooms",
  },
];

evalite<IntentCase, CaseResult, string>("Intent routing — first tool call", {
  data: () =>
    cases.map((intentCase) => ({
      input: intentCase,
      expected: intentCase.expectedFirstTool,
    })),
  task: (input) => runCase(input.message),
  scorers: [
    {
      name: "Routed to expected tool",
      description:
        "The first tool call this turn must match the tool that owns this intent.",
      scorer: ({ output, expected }) =>
        scoreResult(
          output.toolNames[0] === expected,
          `expected first tool "${expected}", got [${output.toolNames.join(", ") || "none"}]`,
        ),
    },
  ],
  columns: ({ input, output }) => [
    { label: "Message", value: input.message },
    { label: "Reply", value: output.text.slice(0, 200) },
    { label: "Tool calls", value: output.toolNames.join(" → ") || "(none)" },
  ],
});

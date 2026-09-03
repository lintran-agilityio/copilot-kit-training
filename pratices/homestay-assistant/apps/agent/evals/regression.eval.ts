import { evalite } from "evalite";

import { runAgentTurn } from "./support/agent-harness";
import { scoreResult } from "./support/checks";
import { installFakeApi } from "./support/fake-api";
import { runCase, type CaseResult } from "./support/run-case";

/**
 * Regression cases for specific, previously-fixed agent bugs. The no-op
 * MODIFY regression (guest states a change that matches the current stay)
 * is NOT repeated here — it already has three layers of coverage:
 * `deterministic/modify-booking.eval.ts` (the pure guard function),
 * `booking-workflow.eval.ts` (agent-turn tool-call assertion), and
 * `response-quality.eval.ts` (reply-wording rubric). Re-running the exact
 * same scenario a fourth time here would be pure duplication, not
 * additional coverage.
 */

// --- "show my bookings" must never fall back to room search --------------
type RoutingCase = { name: string; message: string; forbiddenTool: string };

const showMyBookingsCases: RoutingCase[] = [
  { name: "show my bookings", message: "Show my bookings", forbiddenTool: "find_room" },
  {
    name: "what bookings do I have",
    message: "What bookings do I have?",
    forbiddenTool: "find_room",
  },
];

evalite<RoutingCase, CaseResult, string>(
  "Regression — 'show my bookings' never routes to room search",
  {
    data: () =>
      showMyBookingsCases.map((c) => ({ input: c, expected: "get_bookings" })),
    task: (input) => runCase(input.message),
    scorers: [
      {
        name: "Called get_bookings, not find_room",
        scorer: ({ input, output, expected }) =>
          scoreResult(
            output.toolNames.includes(expected!) &&
              !output.toolNames.includes(input.forbiddenTool),
            `tool calls: [${output.toolNames.join(", ") || "none"}]`,
          ),
      },
    ],
    columns: ({ input, output }) => [
      { label: "Message", value: input.message },
      { label: "Tool calls", value: output.toolNames.join(" → ") || "(none)" },
    ],
  },
);

// --- "available rooms" wording must never be read as LIST_MY_BOOKINGS ----
const availableRoomsCases: RoutingCase[] = [
  {
    name: "show available rooms",
    message: "Show available rooms",
    forbiddenTool: "get_bookings",
  },
  {
    name: "what rooms are available",
    message: "What rooms are available?",
    forbiddenTool: "get_bookings",
  },
  {
    name: "are there any rooms available on a specific date",
    message: "Are there any rooms available on October 15?",
    forbiddenTool: "get_bookings",
  },
];

evalite<RoutingCase, CaseResult, string>(
  "Regression — 'available rooms' wording never routes to booking list",
  {
    data: () =>
      availableRoomsCases.map((c) => ({ input: c, expected: "find_room" })),
    task: (input) => runCase(input.message),
    scorers: [
      {
        name: "Called find_room, not get_bookings",
        scorer: ({ input, output, expected }) =>
          scoreResult(
            output.toolNames.includes(expected!) &&
              !output.toolNames.includes(input.forbiddenTool),
            `tool calls: [${output.toolNames.join(", ") || "none"}]`,
          ),
      },
    ],
    columns: ({ input, output }) => [
      { label: "Message", value: input.message },
      { label: "Tool calls", value: output.toolNames.join(" → ") || "(none)" },
    ],
  },
);

// --- token/context duplication guard (MessageMerger / TokenLimiter) ------
/**
 * Historical bug: a tool-invocation already folded into the assistant
 * message by Mastra's internal MessageMerger, but not yet reflected in
 * `steps[].toolResults`, made the step machine re-force the same tool call
 * every step — ballooning the conversation until `TokenLimiterProcessor`
 * (`AGENT_INPUT_TOKEN_LIMIT`, packages/constants/agent-token-limits.ts)
 * tripped on ordinary turns. The permanent guards are
 * `DedupeToolCallsProcessor` and `excludeResolvedToolCalls`
 * (ag-ui/transcript-filters.ts). This regression sends several realistic
 * turns on ONE thread — including a repeated `get_bookings` request, the
 * exact shape that used to runaway — and asserts every turn completes
 * cleanly with a bounded step count. It intentionally does NOT assert an
 * exact token count (the brief warns against that): `TokenLimiterProcessor`
 * throws a tripwire error on trip, so "every turn resolves without
 * throwing, and step counts stay bounded" is the deterministic, timeless
 * form of this guard.
 */
const MULTI_TURN_MESSAGES = [
  "Show me available rooms for 2 guests",
  "Tell me about the Bamboo Family Suite",
  "Show my bookings",
  "What rooms are available this weekend?",
  "Show my bookings again",
] as const;

const MAX_REASONABLE_STEPS = 8;

evalite<undefined, { turns: number; maxSteps: number; error: string | null }, true>(
  "Regression — multi-turn context does not trip the token limiter",
  {
    data: () => [{ input: undefined, expected: true }],
    task: async () => {
      const fakeApi = installFakeApi();
      const threadId = `eval-regression-context-${Date.now()}`;
      let maxSteps = 0;
      let error: string | null = null;
      let turns = 0;

      try {
        for (const message of MULTI_TURN_MESSAGES) {
          const { result } = await runAgentTurn(message, { threadId });
          turns += 1;
          maxSteps = Math.max(maxSteps, result.steps?.length ?? 0);
          if (result.tripwire) {
            error = `tripwire on turn ${turns} ("${message}"): ${JSON.stringify(result.tripwire)}`;
            break;
          }
        }
      } catch (caught) {
        error = caught instanceof Error ? caught.message : String(caught);
      } finally {
        fakeApi.restore();
      }

      return { turns, maxSteps, error };
    },
    scorers: [
      {
        name: "All turns completed without a tripwire/error",
        scorer: ({ output }) =>
          scoreResult(
            output.error === null && output.turns === MULTI_TURN_MESSAGES.length,
            output.error ?? `completed ${output.turns}/${MULTI_TURN_MESSAGES.length} turns`,
          ),
      },
      {
        name: "Step count per turn stayed bounded",
        description: `No single turn should need more than ${MAX_REASONABLE_STEPS} steps — a runaway forced-tool loop is exactly what this regresses against.`,
        scorer: ({ output }) =>
          scoreResult(
            output.maxSteps <= MAX_REASONABLE_STEPS,
            `max steps seen in one turn: ${output.maxSteps}`,
          ),
      },
    ],
    columns: ({ output }) => [
      {
        label: "Summary",
        value: `${output.turns}/${MULTI_TURN_MESSAGES.length} turns, max ${output.maxSteps} steps/turn`,
      },
      { label: "Error", value: output.error ?? "(none)" },
    ],
  },
);

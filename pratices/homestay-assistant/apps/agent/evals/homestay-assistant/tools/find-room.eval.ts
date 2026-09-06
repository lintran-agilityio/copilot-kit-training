import { evalite } from "evalite";
import { addDaysYmd, formatTodayYmd, getBusinessDates } from "@repo/utils/date";

import { argMatches, scoreResult } from "../../support/checks";
import { toolCallArgs } from "../../support/tool-calls";
import { runCase, type CaseResult } from "../../support/run-case";

/**
 * `find_room` — real LLM agent turns, structured scoring.
 *
 * `find_room` owns every room-discovery intent: search / filter / "available"
 * wording / recommend / soft-book / BOOK name resolution. For this agent the
 * intent IS the first tool it dispatches to (there is no separate intent
 * field), so "routed to find_room first" is the deterministic equivalent of
 * intent classification.
 *
 * Two concerns, two blocks:
 *   1. Selection — search/available/weekend/date-range phrasing → find_room
 *      first, and "available" wording never mis-routes to get_bookings.
 *   2. Arguments — dates normalized to absolute YYYY-MM-DD, guests never
 *      invented, level synonyms, limit. Only relative phrases the system
 *      prompt pre-resolves (`tomorrow`, `this weekend`) are asserted, computed
 *      with the same `@repo/utils/date` helpers the prompt uses.
 *
 * The no-LLM `find_room(book_resolve)` → step-machine fork is in
 * `deterministic/find-room.eval.ts`.
 */

// --- Selection ----------------------------------------------------------
type SelectionCase = {
  name: string;
  message: string;
  /** find_room must be first; none of these may appear this turn. */
  forbidden: string[];
};

const selectionCases: SelectionCase[] = [
  {
    name: "search — guests + explicit date",
    message: "Find me a room for 2 guests on October 10",
    forbidden: ["get_bookings", "get_rooms"],
  },
  {
    name: "search — 'available' wording, no name",
    message: "What rooms are available for two people?",
    forbidden: ["get_bookings", "get_rooms"],
  },
  {
    name: "search — explicit date range",
    message: "Show available rooms from October 10 to October 12",
    forbidden: ["get_bookings", "get_rooms"],
  },
  {
    name: "search — relative weekend phrasing",
    message: "Do you have anything available this weekend?",
    forbidden: ["get_bookings", "get_rooms"],
  },
  {
    name: "available wording — 'Show available rooms' never routes to booking list",
    message: "Show available rooms",
    forbidden: ["get_bookings"],
  },
  {
    name: "available wording — 'what rooms are available' never routes to booking list",
    message: "What rooms are available?",
    forbidden: ["get_bookings"],
  },
  {
    name: "available wording — dated availability never routes to booking list",
    message: "Are there any rooms available on October 15?",
    forbidden: ["get_bookings"],
  },
];

evalite<SelectionCase, CaseResult, SelectionCase>(
  "find_room — selection: discovery intent routes to find_room first",
  {
    data: () => selectionCases.map((c) => ({ input: c, expected: c })),
    task: (input) => runCase(input.message),
    scorers: [
      {
        name: "First tool is find_room",
        scorer: ({ output }) =>
          scoreResult(
            output.toolNames[0] === "find_room",
            `expected first tool "find_room", got [${output.toolNames.join(", ") || "none"}]`,
          ),
      },
      {
        name: "Never mis-routed to a booking-list / browse tool",
        scorer: ({ output, expected }) => {
          const hit = expected!.forbidden.filter((t) =>
            output.toolNames.includes(t),
          );
          return scoreResult(
            hit.length === 0,
            hit.length === 0
              ? "no forbidden tool calls"
              : `unexpectedly called [${hit.join(", ")}]`,
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

// --- Arguments --------------------------------------------------------
const tomorrow = addDaysYmd(formatTodayYmd(), 1);
const businessDates = getBusinessDates(new Date());

type ArgCase = {
  name: string;
  message: string;
  expected: {
    guests?: number;
    date?: string;
    level?: number;
    limit?: number;
    /** field names that must NOT be set (null/undefined/absent all count). */
    unset?: string[];
  };
};

const argCases: ArgCase[] = [
  {
    name: "guests + relative date (tomorrow)",
    message: "Find a room for 3 guests tomorrow",
    expected: { guests: 3, date: tomorrow },
  },
  {
    name: "guests + weekend phrase",
    message: "Show available rooms this weekend for 4 guests",
    expected: { guests: 4, date: businessDates.weekendCheckIn },
  },
  {
    name: "never invent guests — none stated",
    message: "Find a room available tomorrow",
    expected: { date: tomorrow, unset: ["guests"] },
  },
  {
    name: "level synonym — 'top-floor luxury' maps to level 4, never name",
    message: "Show your top-floor luxury suites",
    expected: { level: 4, unset: ["name"] },
  },
  {
    name: "explicit count — 'find me 3 rooms' sets limit",
    message: "Find me 3 rooms for 2 guests",
    expected: { guests: 2, limit: 3 },
  },
];

evalite<ArgCase, CaseResult, ArgCase["expected"]>(
  "find_room — arguments: dates normalized, guests never invented, synonyms",
  {
    data: () => argCases.map((c) => ({ input: c, expected: c.expected })),
    task: (input) => runCase(input.message),
    scorers: [
      {
        name: "Structured args match the request",
        scorer: ({ output, expected }) => {
          const args = toolCallArgs(output.toolCalls, "find_room");
          if (!args) return scoreResult(false, "find_room was never called");

          const problems: string[] = [];
          if (expected!.date !== undefined && args.date !== expected!.date) {
            problems.push(`date="${args.date}" ≠ "${expected!.date}"`);
          }
          if (
            expected!.guests !== undefined &&
            !argMatches(args.guests, expected!.guests)
          ) {
            problems.push(`guests=${args.guests} ≠ ${expected!.guests}`);
          }
          if (
            expected!.level !== undefined &&
            !argMatches(args.level, expected!.level)
          ) {
            problems.push(`level=${args.level} ≠ ${expected!.level}`);
          }
          if (
            expected!.limit !== undefined &&
            !argMatches(args.limit, expected!.limit)
          ) {
            problems.push(`limit=${args.limit} ≠ ${expected!.limit}`);
          }
          for (const field of expected!.unset ?? []) {
            if (!argMatches(args[field], undefined)) {
              problems.push(`${field}=${JSON.stringify(args[field])} should be unset`);
            }
          }

          return scoreResult(
            problems.length === 0,
            problems.length === 0
              ? `matched: ${JSON.stringify(args)}`
              : `${problems.join("; ")} — full args: ${JSON.stringify(args)}`,
          );
        },
      },
    ],
    columns: ({ input, output }) => [
      { label: "Message", value: input.message },
      {
        label: "find_room args",
        value: JSON.stringify(toolCallArgs(output.toolCalls, "find_room") ?? {}),
      },
    ],
  },
);

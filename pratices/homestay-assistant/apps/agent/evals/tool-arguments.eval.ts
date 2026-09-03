import { evalite } from "evalite";
import { addDaysYmd, formatTodayYmd, getBusinessDates } from "@repo/utils/date";

import { argMatches, diffArgs, scoreResult } from "./support/checks";
import { toolCallArgs } from "./support/tool-calls";
import { runCase, type CaseResult } from "./support/run-case";
import { FIXTURE_EXISTING_BOOKING } from "./support/fixtures";

/**
 * Structured tool-argument correctness. Only relative phrases the system
 * prompt itself pre-resolves deterministically (`tomorrow`, `this weekend`
 * — see `src/mastra/utils/current-date.ts::buildDateContextPrompt`) are
 * used for date assertions, computed here with the same `@repo/utils/date`
 * helpers the prompt uses, so expected values stay correct on whatever day
 * the suite actually runs — never a hardcoded date string.
 *
 * `find_room`'s real schema (`packages/schemas/find-room.ts`) has a single
 * `date` field, not a check-in/check-out pair — a search is a point-in-time
 * filter; the stay range is only established later, in
 * `check_room_availability`. Asserting a `checkInDate`/`checkOutDate` pair
 * out of `find_room` itself (as a naive reading of "structured arguments"
 * might expect) would assert against a shape the tool doesn't have.
 */
const tomorrow = addDaysYmd(formatTodayYmd(), 1);
const businessDates = getBusinessDates(new Date());

type FindRoomArgCase = { name: string; message: string };
type FindRoomExpectedArgs = { guests: number | undefined; date: string };

evalite<FindRoomArgCase, CaseResult, FindRoomExpectedArgs>(
  "Tool arguments — find_room date & guest extraction",
  {
  data: () => [
    {
      input: {
        name: "guests + relative date (tomorrow)",
        message: "Find a room for 3 guests tomorrow",
      },
      expected: { guests: 3, date: tomorrow },
    },
    {
      input: {
        name: "guests + weekend phrase",
        message: "Show available rooms this weekend for 4 guests",
      },
      expected: { guests: 4, date: businessDates.weekendCheckIn },
    },
    {
      input: {
        name: "never invent guests — none stated",
        message: "Find a room available tomorrow",
      },
      expected: { guests: undefined, date: tomorrow },
    },
  ],
  task: (input) => runCase(input.message),
  scorers: [
    {
      name: "guests argument matches (never invented)",
      scorer: ({ output, expected }) => {
        const args = toolCallArgs(output.toolCalls, "find_room");
        return scoreResult(
          argMatches(args?.guests, expected!.guests),
          `expected guests=${expected!.guests ?? "(not provided)"}, got guests=${args?.guests ?? "(not provided)"} (args: ${JSON.stringify(args)})`,
        );
      },
    },
    {
      name: "date argument normalized correctly",
      scorer: ({ output, expected }) => {
        const args = toolCallArgs(output.toolCalls, "find_room");
        return scoreResult(
          args?.date === expected!.date,
          `expected date="${expected!.date}", got date="${args?.date}" (args: ${JSON.stringify(args)})`,
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
});

evalite<{ name: string; message: string }, CaseResult, Record<string, unknown>>(
  "Tool arguments — check_room_availability (full-info create)",
  {
    data: () => [
      {
        input: {
          name: "named room + explicit guests + tomorrow, one night",
          message:
            "I want to book the Riverside Twin Room for 2 guests tomorrow, one night",
        },
        expected: {
          roomId: "room-riverside-twin",
          checkInDate: tomorrow,
          checkOutDate: addDaysYmd(tomorrow, 1),
          guests: 2,
          flow: "create",
        },
      },
    ],
    task: (input) => runCase(input.message),
    scorers: [
      {
        name: "availability args match request exactly",
        description:
          "roomId/checkInDate/checkOutDate/guests/flow must match what the guest actually asked for — no invented or stale values.",
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
        value: JSON.stringify(toolCallArgs(output.toolCalls, "check_room_availability") ?? {}),
      },
    ],
  },
);

evalite<{ name: string; message: string }, CaseResult, Record<string, unknown>>(
  "Tool arguments — modify stated-change extraction (preserve untouched fields)",
  {
    data: () => [
      {
        input: {
          name: "extend N nights — compute, don't ask",
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
        description:
          "A stated 'extend N nights' must compute requestedCheckOutDate itself and must NOT fabricate requestedCheckInDate/requestedGuests.",
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
        value: JSON.stringify(toolCallArgs(output.toolCalls, "find_booking_by_id") ?? {}),
      },
    ],
  },
);

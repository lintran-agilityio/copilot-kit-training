import { evalite } from "evalite";
import { TOOL_KEYS } from "@repo/constants";

import {
  isSameModifyStay,
  resolveModifyAvailabilityNextAction,
  type ModifyAvailabilityNextAction,
  type ModifyStayFields,
  type ResolveModifyAvailabilityNextActionInput,
} from "../../../src/mastra/utils/modify-booking";

import { scoreResult } from "../../support/checks";
import { stepContractEval } from "../../support/step-contract";

/**
 * `check_room_availability` — the no-LLM contract, both flows.
 *
 * Three layers, all deterministic:
 *   1. `resolveModifyAvailabilityNextAction` — the exact branch
 *      `evaluateAvailabilityCandidate` (`src/mastra/utils/check-availability-room.ts`)
 *      runs to pick `nextAction`, and the fix for the historical "no-op modify
 *      wrongly opens the confirm dialog" bug.
 *   2. `isSameModifyStay` — the no-op equality check that feeds `stayUnchanged`.
 *   3. The step-machine transition after a completed `check_room_availability`
 *      step: `nextAction`/`available`/`guestsWithinCapacity` → forced confirm
 *      tool (create vs modify) or stop.
 *
 * `homestay-assistant/behavioral/check-room-availability.eval.ts` proves a real
 * model produces correct args into this tool; this proves the routing off its
 * result can never regress.
 */
evalite<
  ResolveModifyAvailabilityNextActionInput,
  ModifyAvailabilityNextAction,
  ModifyAvailabilityNextAction
>("check_room_availability — modify availability next-action contract", {
  data: () => [
    {
      input: {
        available: true,
        guestsWithinCapacity: true,
        isModify: true,
        stayUnchanged: true,
      },
      expected: "stop_booking",
    },
    {
      // The regression case, byte for byte: a no-op modify must stop even
      // when availability/capacity happen to compute as false for some
      // unrelated reason — stayUnchanged overrides both.
      input: {
        available: false,
        guestsWithinCapacity: false,
        isModify: true,
        stayUnchanged: true,
      },
      expected: "stop_booking",
    },
    {
      input: {
        available: true,
        guestsWithinCapacity: true,
        isModify: true,
        stayUnchanged: false,
      },
      expected: "confirm_modify_booking",
    },
    {
      // `nextAction` alone does NOT encode "unavailable due to a date
      // overlap" as stop_booking — it only stops when BOTH available and
      // guestsWithinCapacity are false. A plain date-overlap case (capacity
      // fine) still returns confirm_modify_booking here; the prompt layer
      // is the one responsible for checking `result.available === false`
      // directly and rendering BookingUnavailableModal instead of calling
      // confirm_modify_booking (see WORKFLOW_MODIFY's documented reading
      // order: stayUnchanged → guestsWithinCapacity → available →
      // nextAction, in that priority). Verified against the real function
      // — this is the contract, not a gap.
      input: {
        available: false,
        guestsWithinCapacity: true,
        isModify: true,
        stayUnchanged: false,
      },
      expected: "confirm_modify_booking",
    },
    {
      // The other `stop_booking` branch: unavailable AND over capacity
      // together, with no stayUnchanged involved.
      input: {
        available: false,
        guestsWithinCapacity: false,
        isModify: true,
        stayUnchanged: false,
      },
      expected: "stop_booking",
    },
    {
      input: {
        available: true,
        guestsWithinCapacity: true,
        isModify: false,
        stayUnchanged: false,
      },
      expected: "confirm_booking",
    },
    {
      // Modify never routes to the create-flow confirm tool, even though
      // this input shape (available/capacity true) would otherwise look
      // identical to the create case above but for `isModify`.
      input: {
        available: true,
        guestsWithinCapacity: true,
        isModify: true,
        stayUnchanged: false,
      },
      expected: "confirm_modify_booking",
    },
  ],
  task: (input) => resolveModifyAvailabilityNextAction(input),
  scorers: [
    {
      name: "Matches contract",
      scorer: ({ output, expected }) =>
        scoreResult(
          output === expected,
          `expected "${expected}", got "${output}"`,
        ),
    },
  ],
});

evalite<
  { current: ModifyStayFields; candidate: ModifyStayFields },
  boolean,
  boolean
>("check_room_availability — no-op stay equality (isSameModifyStay)", {
  data: () => [
    {
      input: {
        current: { checkInDate: "2026-10-05", checkOutDate: "2026-10-08", guests: 2 },
        candidate: { checkInDate: "2026-10-05", checkOutDate: "2026-10-08", guests: 2 },
      },
      expected: true,
    },
    {
      input: {
        current: { checkInDate: "2026-10-05", checkOutDate: "2026-10-08", guests: 2 },
        candidate: { checkInDate: "2026-10-05", checkOutDate: "2026-10-08", guests: 3 },
      },
      expected: false,
    },
    {
      input: {
        current: { checkInDate: "2026-10-05", checkOutDate: "2026-10-08", guests: 2 },
        candidate: { checkInDate: "2026-10-06", checkOutDate: "2026-10-08", guests: 2 },
      },
      expected: false,
    },
    {
      input: {
        current: { checkInDate: "2026-10-05", checkOutDate: "2026-10-08", guests: 2 },
        candidate: { checkInDate: "2026-10-05", checkOutDate: "2026-10-09", guests: 2 },
      },
      expected: false,
    },
  ],
  task: ({ current, candidate }) => isSameModifyStay(current, candidate),
  scorers: [
    {
      name: "Matches contract",
      scorer: ({ output, expected }) =>
        scoreResult(
          output === expected,
          `expected ${expected}, got ${output}`,
        ),
    },
  ],
});

/**
 * After a completed `check_room_availability` step, the step machine translates
 * the tool's own encoded decision (`nextAction`, `available`,
 * `guestsWithinCapacity`) into a forced confirm tool or a stop, choosing the
 * create- vs modify-flow confirm tool from `flow` / `excludeBookingId`.
 */
stepContractEval("check_room_availability — result → forced confirm / stop", [
  {
    name: "available (create) → force confirm_booking",
    last: {
      toolName: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
      input: { flow: "create" },
      output: {
        available: true,
        guestsWithinCapacity: true,
        nextAction: "confirm_booking",
        flow: "create",
      },
    },
    expected: `force:${TOOL_KEYS.ACTION.CONFIRM_BOOKING}`,
  },
  {
    name: "unavailable (create) → stop, never confirm",
    last: {
      toolName: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
      input: { flow: "create" },
      output: {
        available: false,
        guestsWithinCapacity: true,
        nextAction: "stop_booking",
        flow: "create",
      },
    },
    expected: "stop",
  },
  {
    name: "over capacity (create) → stop, never confirm",
    last: {
      toolName: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
      input: { flow: "create" },
      output: {
        available: true,
        guestsWithinCapacity: false,
        nextAction: "stop_booking",
        flow: "create",
      },
    },
    expected: "stop",
  },
  {
    name: "available (modify, stay changed) → force confirm_modify_booking",
    last: {
      toolName: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
      input: { flow: "modify", excludeBookingId: "booking-1" },
      output: {
        available: true,
        guestsWithinCapacity: true,
        nextAction: "confirm_modify_booking",
        flow: "modify",
        bookingId: "booking-1",
      },
    },
    expected: `force:${TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING}`,
  },
  {
    name: "no-op modify (candidate equals current stay) → stop, never open confirm_modify_booking",
    last: {
      toolName: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
      input: { flow: "modify", excludeBookingId: "booking-1" },
      output: {
        available: true,
        guestsWithinCapacity: true,
        nextAction: "stop_booking",
        stayUnchanged: true,
        flow: "modify",
        bookingId: "booking-1",
      },
    },
    expected: "stop",
  },
]);

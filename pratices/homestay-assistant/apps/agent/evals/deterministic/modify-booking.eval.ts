import { evalite } from "evalite";
import { TOOL_KEYS, TOOL_PURPOSE } from "@repo/constants";

import {
  isSameModifyStay,
  resolveModifyAvailabilityNextAction,
  type ModifyAvailabilityNextAction,
  type ModifyStayFields,
  type ResolveModifyAvailabilityNextActionInput,
} from "../../src/mastra/booking/modify-booking";

import { scoreResult } from "../support/checks";
import { stepContractEval } from "../support/step-contract";

/**
 * MODIFY flow — the pure no-op/availability contract, plus the step-machine
 * forced transitions. No LLM call, no fixtures, no network.
 *
 * `resolveModifyAvailabilityNextAction` is the exact code path
 * `evaluateAvailabilityCandidate` (`src/mastra/utils/check-availability-room.ts`)
 * runs to pick `nextAction` for `check_room_availability`, and the exact fix
 * for the historical "no-op modify wrongly opens the confirm dialog" bug (see
 * `modify-booking.ts` doc comment). The `behavioral/` suite proves the prompt
 * also honors this contract when a real model drives the turn; this file
 * proves the contract itself can never regress.
 */
evalite<
  ResolveModifyAvailabilityNextActionInput,
  ModifyAvailabilityNextAction,
  ModifyAvailabilityNextAction
>("MODIFY booking — availability next-action contract", {
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
>("MODIFY booking — no-op stay equality (isSameModifyStay)", {
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
 * After `find_booking_by_id(modify)` pins exactly one booking, the step
 * machine routes on whether the guest already stated the new value:
 *   no stated change → edit_modify_booking (opens the modify FORM)
 *   stated change    → check_room_availability → confirm_modify_booking → update_booking
 * A no-op change (candidate equals the current stay) always stops.
 */
stepContractEval("MODIFY booking — step-machine forced transitions", [
  {
    name: "find_booking_by_id(modify) · 1 booking · no stated change → open the modify form (edit_modify_booking)",
    last: {
      toolName: TOOL_KEYS.BOOKING.FIND_BY_ID,
      input: { purpose: TOOL_PURPOSE.FIND_BOOKING_BY_ID.MODIFY },
      output: {
        bookings: [
          {
            bookingId: "booking-1",
            roomId: "room-riverside-twin",
            checkInDate: "2026-10-05",
            checkOutDate: "2026-10-08",
            guests: 2,
          },
        ],
      },
    },
    expected: `force:${TOOL_KEYS.ACTION.EDIT_MODIFY_BOOKING}`,
  },
  {
    name: "find_booking_by_id(modify) · 1 booking · new check-in already stated → skip the form, force availability",
    last: {
      toolName: TOOL_KEYS.BOOKING.FIND_BY_ID,
      input: { purpose: TOOL_PURPOSE.FIND_BOOKING_BY_ID.MODIFY },
      output: {
        bookings: [
          {
            bookingId: "booking-1",
            roomId: "room-riverside-twin",
            checkInDate: "2026-10-05",
            checkOutDate: "2026-10-08",
            guests: 2,
          },
        ],
        requestedCheckInDate: "2026-11-01",
      },
    },
    expected: `force:${TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY}`,
  },
  {
    name: "find_booking_by_id(modify) · multiple matches → no forced step (the picker resolves it)",
    last: {
      toolName: TOOL_KEYS.BOOKING.FIND_BY_ID,
      input: { purpose: TOOL_PURPOSE.FIND_BOOKING_BY_ID.MODIFY },
      output: {
        bookings: [{ bookingId: "booking-1" }, { bookingId: "booking-2" }],
      },
    },
    expected: "pass",
  },
  {
    name: "modify picker selection confirmed → force find_booking_by_id for the chosen stay",
    last: {
      toolName: TOOL_KEYS.BOOKING.SHOW_MODIFY_DIALOG_SELECT,
      output: { confirmed: true, bookingId: "booking-1" },
    },
    expected: `force:${TOOL_KEYS.BOOKING.FIND_BY_ID}`,
  },
  {
    name: "edit form submitted → force availability with the edited stay",
    last: {
      toolName: TOOL_KEYS.ACTION.EDIT_MODIFY_BOOKING,
      output: { confirmed: true },
    },
    expected: `force:${TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY}`,
  },
  {
    name: "availability OK (modify, stay changed) → force confirm_modify_booking",
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
  {
    name: "guest confirmed the change → force the terminal update_booking",
    last: {
      toolName: TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING,
      output: { confirmed: true },
    },
    expected: `force:${TOOL_KEYS.BOOKING.UPDATE_BOOKING}`,
  },
  {
    name: "guest dismissed the modify confirm dialog → stop",
    last: {
      toolName: TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING,
      output: { confirmed: false },
    },
    expected: "stop",
  },
  {
    name: "update_booking returned → stop (turn is done)",
    last: {
      toolName: TOOL_KEYS.BOOKING.UPDATE_BOOKING,
      output: { id: "booking-1", status: "confirmed" },
    },
    expected: "stop",
  },
]);

import { TOOL_KEYS } from "@repo/constants";

import { stepContractEval } from "../support/step-contract";

/**
 * CANCEL flow — step-machine forced transitions, no LLM.
 *
 * The model resolves the target (`find_bookings`) and opens
 * `show_cancel_dialog_confirm` itself; the step machine only enforces the gate
 * AFTER the dialog: confirmed → cancel_booking, dismissed → stop.
 */
stepContractEval("CANCEL booking — step-machine forced transitions", [
  {
    name: "find_bookings (resolve the target) → no forced step (agent opens the dialog)",
    last: {
      toolName: TOOL_KEYS.BOOKING.FIND,
      output: { bookings: [{ bookingId: "booking-1" }] },
    },
    expected: "pass",
  },
  {
    name: "cancel dialog confirmed → force the terminal cancel_booking",
    last: {
      toolName: TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM,
      output: { confirmed: true, bookingId: "booking-1" },
    },
    expected: `force:${TOOL_KEYS.BOOKING.CANCEL}`,
  },
  {
    name: "cancel dialog dismissed → stop, never cancel",
    last: {
      toolName: TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM,
      output: { confirmed: false },
    },
    expected: "stop",
  },
  {
    name: "cancel_booking returned → stop (turn is done)",
    last: {
      toolName: TOOL_KEYS.BOOKING.CANCEL,
      output: { id: "booking-1", status: "cancelled" },
    },
    expected: "stop",
  },
]);

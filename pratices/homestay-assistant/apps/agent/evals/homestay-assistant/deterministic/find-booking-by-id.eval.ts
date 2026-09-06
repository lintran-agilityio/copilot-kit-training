import { TOOL_KEYS, TOOL_PURPOSE } from "@repo/constants";

import { stepContractEval } from "../../support/step-contract";

/**
 * `find_booking_by_id` — the MODIFY resolution junction, no LLM.
 *
 * After `find_booking_by_id(purpose: "modify")` pins exactly one booking, the
 * step machine routes on whether the guest already stated a new value (echoed
 * on the OUTPUT — `findBookingByIdTool` merges its own args with anything
 * pinned from an earlier `show_modify_dialog_select` pick):
 *   no stated change → `edit_modify_booking` (opens the modify FORM)
 *   stated change    → `check_room_availability` (skip the form)
 * Multiple matches → no forced step (the picker resolves it).
 *
 * `purpose: "cancel"` never auto-routes here — the CANCEL flow forces nothing
 * until `show_cancel_dialog_confirm` returns (see `cancel-booking.eval.ts`).
 * The gates AFTER the edit form are in `update-booking.eval.ts`.
 */
stepContractEval("find_booking_by_id — MODIFY: form vs availability", [
  {
    name: "modify · 1 booking · no stated change → open the modify form (edit_modify_booking)",
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
    name: "modify · 1 booking · new check-in already stated → skip the form, force availability",
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
    name: "modify · multiple matches → no forced step (the picker resolves it)",
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
    name: "cancel · 1 booking → no forced step (only show_cancel_dialog_confirm gates cancel)",
    last: {
      toolName: TOOL_KEYS.BOOKING.FIND_BY_ID,
      input: { purpose: TOOL_PURPOSE.FIND_BOOKING_BY_ID.CANCEL },
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
    expected: "pass",
  },
]);

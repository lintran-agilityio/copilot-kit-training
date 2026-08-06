import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { TOOL_KEYS } from "@repo/constants";

import { resolveBookingStepTransition } from "./booking-step-transitions.ts";
import { parseBookStayMessage } from "./parse-book-stay.ts";

describe("resolveBookingStepTransition CREATE draft routing", () => {
  it("routes booking_draft confirmed:true to availability", () => {
    assert.deepEqual(
      resolveBookingStepTransition({
        toolName: TOOL_KEYS.ACTION.BOOKING_DRAFT,
        output: {
          confirmed: true,
          mode: "CREATE",
          roomId: "r1",
          checkInDate: "2026-08-19",
          checkOutDate: "2026-08-21",
          guests: 3,
        },
      }),
      {
        type: "call",
        toolName: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
      },
    );
  });

  it("stops when booking_draft is declined", () => {
    assert.deepEqual(
      resolveBookingStepTransition({
        toolName: TOOL_KEYS.ACTION.BOOKING_DRAFT,
        output: { confirmed: false },
      }),
      { type: "stop" },
    );
  });

  it("returns CREATE availability failures to booking_draft HITL", () => {
    assert.deepEqual(
      resolveBookingStepTransition({
        toolName: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
        input: { flow: "create", roomId: "r1" },
        output: {
          available: false,
          guestsWithinCapacity: true,
          nextAction: "stop_booking",
          flow: "create",
        },
      }),
      {
        type: "call",
        toolName: TOOL_KEYS.ACTION.BOOKING_DRAFT,
      },
    );
  });

  it("keeps MODIFY availability failures as stop (unchanged)", () => {
    assert.deepEqual(
      resolveBookingStepTransition({
        toolName: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
        input: { flow: "modify", excludeBookingId: "b1" },
        output: {
          available: false,
          guestsWithinCapacity: true,
          nextAction: "stop_booking",
          flow: "modify",
        },
      }),
      { type: "stop" },
    );
  });

  it("still forces confirm_booking after successful CREATE availability", () => {
    assert.deepEqual(
      resolveBookingStepTransition({
        toolName: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
        input: { flow: "create" },
        output: {
          available: true,
          guestsWithinCapacity: true,
          nextAction: TOOL_KEYS.ACTION.CONFIRM_BOOKING,
          flow: "create",
        },
      }),
      {
        type: "call",
        toolName: TOOL_KEYS.ACTION.CONFIRM_BOOKING,
      },
    );
  });

  it("preserves edit_modify_booking → availability for MODIFY", () => {
    assert.deepEqual(
      resolveBookingStepTransition({
        toolName: TOOL_KEYS.ACTION.EDIT_MODIFY_BOOKING,
        output: {
          confirmed: true,
          bookingId: "b1",
          roomId: "r1",
          checkInDate: "2026-08-10",
          checkOutDate: "2026-08-12",
          guests: 2,
        },
      }),
      {
        type: "call",
        toolName: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
      },
    );
  });
});

describe("parseBookStayMessage", () => {
  it("parses a complete [book-stay] submit", () => {
    assert.deepEqual(
      parseBookStayMessage(
        "[book-stay] roomId: bamboo-1. checkInDate: 2026-08-19. checkOutDate: 2026-08-21. guests: 3. Book Bamboo.",
      ),
      {
        roomId: "bamboo-1",
        checkInDate: "2026-08-19",
        checkOutDate: "2026-08-21",
        guests: 3,
      },
    );
  });

  it("returns null for non book-stay messages", () => {
    assert.equal(parseBookStayMessage("Book Bamboo next Friday"), null);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  extractStatedModifyChanges,
  isStructuredBookingUiPrompt,
  mergeStatedModifyStay,
  resolveBookingFromLookupResult,
  resolveCalendarDate,
} from "./stated-modify-changes.ts";

import { TOOL_KEYS } from "@repo/constants";

const TODAY = "2026-08-06";

const CURRENT = {
  checkInDate: "2026-08-10",
  checkOutDate: "2026-08-12",
  guests: 2,
};

describe("stated-modify-changes", () => {
  it("skips structured UI prompt tags", () => {
    assert.equal(
      isStructuredBookingUiPrompt(
        "[booking-modify] bookingId: abc. I want to modify this booking.",
      ),
      true,
    );
    assert.equal(
      extractStatedModifyChanges(
        "[booking-modify] bookingId: abc. Change checkout to Aug 22",
        TODAY,
      ),
      null,
    );
  });

  it("extracts checkout date from natural language", () => {
    assert.deepEqual(
      extractStatedModifyChanges("Change checkout to Aug 22", TODAY),
      { checkOutDate: "2026-08-22" },
    );
  });

  it("extracts guest count changes", () => {
    assert.deepEqual(
      extractStatedModifyChanges("Change guests to 3", TODAY),
      { guests: 3 },
    );
  });

  it("extracts extend-by-nights relative changes", () => {
    assert.deepEqual(
      extractStatedModifyChanges("Extend my stay by one night", TODAY),
      { extendCheckoutByNights: 1 },
    );
  });

  it("returns null for vague modify requests", () => {
    assert.equal(
      extractStatedModifyChanges("I want to change my booking", TODAY),
      null,
    );
    assert.equal(
      extractStatedModifyChanges("Change to Aug 22", TODAY),
      null,
    );
  });

  it("rolls month/day to next year when already past", () => {
    assert.equal(resolveCalendarDate("2026-09-01", 8, 22), "2027-08-22");
  });

  it("merges absolute checkout over the current stay", () => {
    assert.deepEqual(
      mergeStatedModifyStay(CURRENT, { checkOutDate: "2026-08-22" }),
      {
        checkInDate: "2026-08-10",
        checkOutDate: "2026-08-22",
        guests: 2,
      },
    );
  });

  it("merges extend-by-nights onto current checkout", () => {
    assert.deepEqual(
      mergeStatedModifyStay(CURRENT, { extendCheckoutByNights: 1 }),
      {
        checkInDate: "2026-08-10",
        checkOutDate: "2026-08-13",
        guests: 2,
      },
    );
  });

  it("rejects merges that do not change the stay or invert dates", () => {
    assert.equal(mergeStatedModifyStay(CURRENT, { guests: 2 }), null);
    assert.equal(
      mergeStatedModifyStay(CURRENT, { checkOutDate: "2026-08-10" }),
      null,
    );
  });

  it("resolves find_booking_by_id and single get_bookings rows", () => {
    assert.deepEqual(
      resolveBookingFromLookupResult(TOOL_KEYS.BOOKING.FIND_BY_ID, {
        bookings: [
          {
            bookingId: "b1",
            roomId: "r1",
            checkInDate: "2026-08-10",
            checkOutDate: "2026-08-12",
            guests: 2,
          },
        ],
        bookingId: "b1",
        room: { id: "r1", capacity: 4 },
      }),
      {
        bookingId: "b1",
        roomId: "r1",
        capacity: 4,
        current: CURRENT,
      },
    );

    assert.equal(
      resolveBookingFromLookupResult(TOOL_KEYS.BOOKING.GET, {
        bookings: [
          {
            id: "b1",
            roomId: "r1",
            checkInDate: "2026-08-10",
            checkOutDate: "2026-08-12",
            guests: 2,
          },
          {
            id: "b2",
            roomId: "r2",
            checkInDate: "2026-08-14",
            checkOutDate: "2026-08-15",
            guests: 1,
          },
        ],
      }),
      null,
    );
  });
});

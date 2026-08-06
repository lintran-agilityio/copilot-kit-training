import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BOOKING_DRAFT_MODE, BOOKING_DRAFT_STATUS } from "@repo/schemas/booking-draft";

import {
  applyMergeToBookingDraft,
  clearBookingWorkflowDraftState,
  readBookingDraft,
  readBookingDraftStayForAvailability,
  readStructuredSearchContext,
  setBookingDraftStatus,
  writeStructuredSearchContext,
} from "./booking-draft-context.ts";

class MockRequestContext {
  #store = new Map<string, unknown>();

  get(key: string) {
    return this.#store.get(key);
  }

  set(key: string, value: unknown) {
    if (value === undefined) {
      this.#store.delete(key);
      return;
    }
    this.#store.set(key, value);
  }
}

describe("booking-draft-context", () => {
  it("progressively updates the same draft across merges", () => {
    const requestContext = new MockRequestContext() as never;

    const first = applyMergeToBookingDraft(requestContext, {
      mode: BOOKING_DRAFT_MODE.CREATE,
      ui: {
        roomId: "bamboo-1",
        roomName: "Bamboo Family Suite",
      },
    });

    assert.equal(first.roomId, "bamboo-1");
    assert.equal(first.provenance?.roomId?.source, "ui");
    assert.deepEqual(first.missingFields, ["checkIn", "checkOut", "guests"]);
    assert.equal(first.status, BOOKING_DRAFT_STATUS.INCOMPLETE);

    writeStructuredSearchContext(requestContext, {
      date: "2026-08-07",
      guests: 3,
    });

    const second = applyMergeToBookingDraft(requestContext, {
      user: { checkInDate: "2026-08-19" },
    });

    assert.equal(second.roomId, "bamboo-1");
    assert.equal(second.checkInDate, "2026-08-19");
    assert.equal(second.guests, 3);
    assert.equal(second.provenance?.checkInDate?.source, "user");
    assert.equal(
      second.provenance?.guests?.source,
      "structured-search-context",
    );
    assert.deepEqual(second.missingFields, ["checkOut"]);
    assert.equal(readBookingDraft(requestContext)?.checkInDate, "2026-08-19");

    const third = applyMergeToBookingDraft(requestContext, {
      user: { checkOutDate: "2026-08-21" },
    });

    assert.equal(third.checkOutDate, "2026-08-21");
    assert.deepEqual(third.missingFields, []);
    assert.equal(third.status, BOOKING_DRAFT_STATUS.READY_FOR_AVAILABILITY);

    const stay = readBookingDraftStayForAvailability(requestContext);
    assert.deepEqual(stay, {
      mode: BOOKING_DRAFT_MODE.CREATE,
      roomId: "bamboo-1",
      checkInDate: "2026-08-19",
      checkOutDate: "2026-08-21",
      guests: 3,
    });
  });

  it("lets user message beat structured search date", () => {
    const requestContext = new MockRequestContext() as never;

    writeStructuredSearchContext(requestContext, {
      date: "2026-08-07",
      guests: 2,
    });

    const draft = applyMergeToBookingDraft(requestContext, {
      user: {
        roomId: "r1",
        checkInDate: "2026-08-14",
        checkOutDate: "2026-08-15",
      },
    });

    assert.equal(draft.checkInDate, "2026-08-14");
    assert.equal(draft.provenance?.checkInDate?.source, "user");
    assert.equal(draft.guests, 2);
  });

  it("does not invent guests and keeps availability stay null while incomplete", () => {
    const requestContext = new MockRequestContext() as never;

    applyMergeToBookingDraft(requestContext, {
      user: {
        roomId: "r1",
        checkInDate: "2026-08-19",
        checkOutDate: "2026-08-20",
      },
    });

    assert.equal(readBookingDraft(requestContext)?.guests, null);
    assert.equal(readBookingDraftStayForAvailability(requestContext), null);
  });

  it("preserves READY_FOR_CONFIRM when stay remains complete", () => {
    const requestContext = new MockRequestContext() as never;

    applyMergeToBookingDraft(requestContext, {
      user: {
        roomId: "r1",
        checkInDate: "2026-08-19",
        checkOutDate: "2026-08-20",
        guests: 2,
      },
    });
    setBookingDraftStatus(
      requestContext,
      BOOKING_DRAFT_STATUS.READY_FOR_CONFIRM,
    );

    const next = applyMergeToBookingDraft(requestContext, {
      user: { guests: 3 },
    });

    assert.equal(next.guests, 3);
    assert.equal(next.status, BOOKING_DRAFT_STATUS.READY_FOR_CONFIRM);
  });

  it("clears draft and structured search together on workflow reset", () => {
    const requestContext = new MockRequestContext() as never;

    applyMergeToBookingDraft(requestContext, {
      user: { roomId: "r1", guests: 2 },
    });
    writeStructuredSearchContext(requestContext, { guests: 2 });

    clearBookingWorkflowDraftState(requestContext);

    assert.equal(readBookingDraft(requestContext), null);
    assert.equal(readStructuredSearchContext(requestContext), null);
  });

  it("stores requestedTime as metadata without using it for availability", () => {
    const requestContext = new MockRequestContext() as never;

    const draft = applyMergeToBookingDraft(requestContext, {
      user: {
        roomId: "r1",
        checkInDate: "2026-08-18",
        checkOutDate: "2026-08-19",
        guests: 2,
      },
      requestedTime: "20:00",
    });

    assert.equal(draft.requestedTime, "20:00");
    const stay = readBookingDraftStayForAvailability(requestContext);
    assert.ok(stay);
    assert.equal(
      Object.prototype.hasOwnProperty.call(stay, "requestedTime"),
      false,
    );
  });
});

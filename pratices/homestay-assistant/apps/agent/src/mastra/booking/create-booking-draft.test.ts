import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  emptyCreateBookingDraft,
  extractCreateBookingUserFields,
  extractRequestedTime,
  getMissingBookingFields,
  mergeCreateBookingDraft,
  resolveWeekdayDate,
} from "./create-booking-draft.ts";

const TODAY = "2026-08-06"; // Thursday
const TOMORROW = "2026-08-07";
const WEEKEND_CHECK_IN = "2026-08-08"; // Saturday
const WEEKEND_CHECK_OUT = "2026-08-09";

const BUSINESS_DATES = {
  today: TODAY,
  tomorrow: TOMORROW,
  weekendCheckIn: WEEKEND_CHECK_IN,
  weekendCheckOut: WEEKEND_CHECK_OUT,
};

describe("mergeCreateBookingDraft", () => {
  it("returns an empty draft with all fields missing when no sources exist", () => {
    const result = mergeCreateBookingDraft({});

    assert.deepEqual(result.draft, emptyCreateBookingDraft());
    assert.deepEqual(result.missingFields, [
      "roomId",
      "checkIn",
      "checkOut",
      "guests",
    ]);
    assert.equal(result.provenanced.guests, null);
  });

  it("prefers user check-in over structured search date", () => {
    const nextFriday = "2026-08-14";

    const result = mergeCreateBookingDraft({
      user: {
        roomId: "bamboo-1",
        roomName: "Bamboo Family Suite",
        checkInDate: nextFriday,
      },
      structuredSearchContext: {
        date: TOMORROW,
        guests: 3,
      },
    });

    assert.equal(result.draft.checkInDate, nextFriday);
    assert.equal(result.provenanced.checkInDate?.source, "user");
    assert.equal(result.draft.guests, 3);
    assert.equal(
      result.provenanced.guests?.source,
      "structured-search-context",
    );
    assert.deepEqual(result.missingFields, ["checkOut"]);
  });

  it("attributes Book-button room selection to ui, not user", () => {
    const result = mergeCreateBookingDraft({
      ui: {
        roomId: "bamboo-1",
        roomName: "Bamboo Family Suite",
      },
      structuredSearchContext: {
        date: TOMORROW,
        guests: 3,
      },
    });

    assert.equal(result.draft.roomId, "bamboo-1");
    assert.equal(result.provenanced.roomId?.source, "ui");
    assert.equal(result.provenanced.roomName?.source, "ui");
    assert.equal(result.draft.checkInDate, TOMORROW);
    assert.equal(
      result.provenanced.checkInDate?.source,
      "structured-search-context",
    );
  });

  it("lets latest user message beat ui room selection", () => {
    const result = mergeCreateBookingDraft({
      user: { roomId: "misty-1", roomName: "Misty Pavilion" },
      ui: { roomId: "bamboo-1", roomName: "Bamboo Family Suite" },
    });

    assert.equal(result.draft.roomId, "misty-1");
    assert.equal(result.provenanced.roomId?.source, "user");
  });

  it("never lets structured search overwrite an explicit user guest count", () => {
    const result = mergeCreateBookingDraft({
      user: { guests: 2 },
      structuredSearchContext: { guests: 5 },
    });

    assert.equal(result.draft.guests, 2);
    assert.equal(result.provenanced.guests?.source, "user");
  });

  it("fills Bamboo partial book: room+checkIn from user, guests from search, checkOut missing", () => {
    const result = mergeCreateBookingDraft({
      user: {
        roomId: "bamboo-1",
        roomName: "Bamboo Family Suite",
        checkInDate: "2026-08-19",
      },
      structuredSearchContext: {
        date: TOMORROW,
        guests: 3,
      },
    });

    assert.deepEqual(result.draft, {
      roomId: "bamboo-1",
      roomName: "Bamboo Family Suite",
      checkInDate: "2026-08-19",
      checkOutDate: null,
      guests: 3,
    });
    assert.equal(result.provenanced.roomId?.source, "user");
    assert.equal(result.provenanced.checkInDate?.source, "user");
    assert.equal(
      result.provenanced.guests?.source,
      "structured-search-context",
    );
    assert.equal(result.provenanced.checkOutDate, null);
    assert.deepEqual(result.missingFields, ["checkOut"]);
  });

  it("keeps guests null when no source states an explicit guest count", () => {
    const result = mergeCreateBookingDraft({
      user: {
        roomId: "r1",
        checkInDate: "2026-08-19",
        checkOutDate: "2026-08-20",
      },
      draft: { guests: null },
      structuredSearchContext: { guests: null },
    });

    assert.equal(result.draft.guests, null);
    assert.ok(result.missingFields.includes("guests"));
  });

  it("ignores invalid guest values (0, negative, non-integer)", () => {
    const result = mergeCreateBookingDraft({
      user: { guests: 0 },
      draft: { guests: -1 },
      structuredSearchContext: { guests: 1.5 as unknown as number },
    });

    assert.equal(result.draft.guests, null);
  });

  it("applies full source priority including ui and structured contexts", () => {
    const result = mergeCreateBookingDraft({
      user: { checkInDate: "2026-08-20" },
      ui: { roomId: "ui-room", roomName: "UI Room" },
      draft: {
        checkInDate: "2026-08-15",
        checkOutDate: "2026-08-16",
        guests: 2,
      },
      structuredBookingContext: {
        checkInDate: "2026-08-10",
        checkOutDate: "2026-08-11",
        guests: 4,
        roomId: "ctx-room",
        roomName: "Context Room",
      },
      structuredSearchContext: {
        date: TOMORROW,
        guests: 6,
      },
    });

    assert.equal(result.draft.checkInDate, "2026-08-20");
    assert.equal(result.provenanced.checkInDate?.source, "user");
    assert.equal(result.draft.checkOutDate, "2026-08-16");
    assert.equal(result.provenanced.checkOutDate?.source, "draft");
    assert.equal(result.draft.guests, 2);
    assert.equal(result.provenanced.guests?.source, "draft");
    assert.equal(result.draft.roomId, "ui-room");
    assert.equal(result.provenanced.roomId?.source, "ui");
    assert.deepEqual(result.missingFields, []);
  });

  it("uses structured search date only when check-in is otherwise unknown", () => {
    const result = mergeCreateBookingDraft({
      structuredSearchContext: { date: TOMORROW, guests: 3 },
    });

    assert.equal(result.draft.checkInDate, TOMORROW);
    assert.equal(
      result.provenanced.checkInDate?.source,
      "structured-search-context",
    );
    assert.equal(result.draft.checkOutDate, null);
  });

  it("does not treat empty strings as set values", () => {
    const result = mergeCreateBookingDraft({
      user: { roomId: "  ", roomName: "", checkInDate: "   " },
      draft: { roomId: "draft-room", checkInDate: "2026-08-19" },
    });

    assert.equal(result.draft.roomId, "draft-room");
    assert.equal(result.draft.checkInDate, "2026-08-19");
    assert.equal(result.provenanced.roomId?.source, "draft");
  });

  it("prefers draft over structured booking context when user/ui are silent", () => {
    const result = mergeCreateBookingDraft({
      draft: { guests: 3, checkOutDate: "2026-08-21" },
      structuredBookingContext: { guests: 5, checkOutDate: "2026-08-22" },
    });

    assert.equal(result.draft.guests, 3);
    assert.equal(result.provenanced.guests?.source, "draft");
    assert.equal(result.draft.checkOutDate, "2026-08-21");
    assert.equal(result.provenanced.checkOutDate?.source, "draft");
  });

  it("applies safe defaults only when stronger sources are empty", () => {
    const result = mergeCreateBookingDraft({
      defaults: { checkInDate: TODAY },
    });

    assert.equal(result.draft.checkInDate, TODAY);
    assert.equal(result.provenanced.checkInDate?.source, "default");
    assert.equal(result.draft.guests, null);
  });
});

describe("getMissingBookingFields", () => {
  it("lists only absent required fields", () => {
    assert.deepEqual(
      getMissingBookingFields({
        roomId: "r1",
        checkInDate: "2026-08-19",
        checkOutDate: null,
        guests: 3,
      }),
      ["checkOut"],
    );
  });
});

describe("extractCreateBookingUserFields", () => {
  it("parses Bamboo Family at 19 Aug 20:00PM as check-in date + optional time", () => {
    const extracted = extractCreateBookingUserFields(
      "I want to booking Bamboo Family room at 19 Aug 20:00PM",
      BUSINESS_DATES,
    );

    assert.equal(extracted.fields.checkInDate, "2026-08-19");
    assert.equal(extracted.fields.checkOutDate, undefined);
    assert.equal(extracted.requestedTime, "20:00");
  });

  it("parses Aug 18 at 8PM without failing on time", () => {
    const extracted = extractCreateBookingUserFields(
      "Book Bamboo Suite Aug 18 at 8PM",
      BUSINESS_DATES,
    );

    assert.equal(extracted.fields.checkInDate, "2026-08-18");
    assert.equal(extracted.requestedTime, "20:00");
  });

  it("resolves next Friday to the upcoming Friday (Thursday → Aug 7)", () => {
    const extracted = extractCreateBookingUserFields(
      "Book Bamboo Suite next Friday",
      BUSINESS_DATES,
    );

    assert.equal(extracted.fields.checkInDate, "2026-08-07");
    assert.equal(extracted.requestedTime, null);
  });

  it("resolves tomorrow and this weekend", () => {
    assert.equal(
      extractCreateBookingUserFields("Book a room tomorrow", BUSINESS_DATES)
        .fields.checkInDate,
      TOMORROW,
    );

    const weekend = extractCreateBookingUserFields(
      "Book this weekend",
      BUSINESS_DATES,
    );
    assert.equal(weekend.fields.checkInDate, WEEKEND_CHECK_IN);
    assert.equal(weekend.fields.checkOutDate, WEEKEND_CHECK_OUT);
  });

  it("parses from/to date ranges and guest counts", () => {
    const extracted = extractCreateBookingUserFields(
      "Book from Aug 19 to Aug 22 for 3 guests",
      BUSINESS_DATES,
    );

    assert.equal(extracted.fields.checkInDate, "2026-08-19");
    assert.equal(extracted.fields.checkOutDate, "2026-08-22");
    assert.equal(extracted.fields.guests, 3);
  });

  it("parses explicit check-in / check-out cues", () => {
    const extracted = extractCreateBookingUserFields(
      "Check-in Aug 10 check-out Aug 12",
      BUSINESS_DATES,
    );

    assert.equal(extracted.fields.checkInDate, "2026-08-10");
    assert.equal(extracted.fields.checkOutDate, "2026-08-12");
  });

  it("feeds extracted user fields into merge ahead of structured search", () => {
    const extracted = extractCreateBookingUserFields(
      "Book Bamboo Suite Aug 14",
      BUSINESS_DATES,
    );

    const result = mergeCreateBookingDraft({
      user: {
        ...extracted.fields,
        roomId: "bamboo-1",
        roomName: "Bamboo Family Suite",
      },
      structuredSearchContext: {
        date: TOMORROW,
        guests: 3,
      },
    });

    assert.equal(result.draft.checkInDate, "2026-08-14");
    assert.equal(result.provenanced.checkInDate?.source, "user");
    assert.equal(result.draft.guests, 3);
    assert.deepEqual(result.missingFields, ["checkOut"]);
  });
});

describe("extractRequestedTime / resolveWeekdayDate", () => {
  it("normalizes 20:00PM and 8PM", () => {
    assert.equal(extractRequestedTime("at 20:00PM"), "20:00");
    assert.equal(extractRequestedTime("at 8PM"), "20:00");
    assert.equal(extractRequestedTime("at 8:30 am"), "08:30");
    assert.equal(extractRequestedTime("no time here"), null);
  });

  it("resolves bare/next Friday: upcoming day, or +7 when today is that weekday", () => {
    assert.equal(resolveWeekdayDate(TODAY, 5, false), "2026-08-07");
    assert.equal(resolveWeekdayDate(TODAY, 5, true), "2026-08-07");
    assert.equal(resolveWeekdayDate("2026-08-07", 5, true), "2026-08-14");
    assert.equal(resolveWeekdayDate("2026-08-07", 5, false), "2026-08-07");
  });
});

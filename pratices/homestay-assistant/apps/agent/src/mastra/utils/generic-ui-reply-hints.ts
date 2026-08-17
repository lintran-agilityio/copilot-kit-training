/**
 * Model-facing replyHint builders for Generic UI turns.
 * Kept free of path aliases so unit tests can import without the Mastra loader.
 */

export type FindRoomReplyPurpose =
  | "search"
  | "recommend"
  | "book_resolve"
  | "resolve"
  | undefined;

/**
 * Actionable Booking Form / Room Detail is the response — no instructional
 * handoff about the form being open or how to use its controls.
 */
export const buildGetRoomByIdReplyHint = (roomName: string): string =>
  `Actionable Booking Form / room detail Generic UI is already rendered for "${roomName}". ` +
  `Do NOT send any chat text that the form is open, ready, or inviting the guest to select dates / tap "Book this room" / complete required fields — the Generic UI is the response (tools-only is allowed). ` +
  `Still send short chat text only for errors, hard failures, or clarifications the UI cannot collect. ` +
  `Do NOT repeat or reference any previous room list, find_room result, or search response. ` +
  `Do NOT list price, amenities, description, or any other room field — the UI already shows them.`;

/**
 * Model-facing hint after find_room. book_resolve + 1 match must not claim
 * cards were rendered (FE suppresses Room List) and must continue BOOK.
 */
export const buildFindRoomReplyHint = (
  matchCount: number,
  purpose: FindRoomReplyPurpose,
): string => {
  if (purpose === "resolve") {
    if (matchCount === 0) {
      return "No room matched that name — Room List is suppressed. Reply with ONE short sentence that no room by that name exists; do NOT call get_bookings. Do NOT invent a roomId.";
    }
    if (matchCount === 1) {
      return "Room resolved for cancel/modify lookup — Room List is suppressed (do NOT say cards were shown). Use rooms[0].id as roomId and continue the cancel/modify workflow's get_bookings call in the SAME turn — do NOT ask the guest to confirm the room name first.";
    }
    return `Multiple rooms matched that name (${matchCount}) — Room List is suppressed. Reply with ONE short sentence naming the matching rooms and asking which one they mean; do NOT call get_bookings until they pick.`;
  }

  if (purpose === "book_resolve") {
    if (matchCount === 0) {
      return "No room matched that booking name. Reply with ONE short sentence that nothing matched; suggest a different room name. Do NOT invent rooms. Do NOT call check_room_availability.";
    }
    if (matchCount === 1) {
      return (
        "Room resolved for booking — Room List is suppressed (do NOT say cards were shown). " +
        "Check the LATEST user message only (not older searches, continuity dates, or working memory): " +
        "does it state an explicit check-in date (or a resolvable relative date like today/tomorrow/weekend/weekday) " +
        "AND a guest count for this room? " +
        "If BOTH are present (full info): skip the Booking Form — call check_room_availability (flow=create) next " +
        "with those values (checkOutDate defaults to checkInDate + 1 day only when no stay length was stated), " +
        "then confirm_booking when available. " +
        "If EITHER is missing (partial info): call get_room_by_id next to open the Booking Form so the guest " +
        "sets/confirms the missing field(s) — do NOT invent a missing check-in date or guest count, and do NOT " +
        "ask for it in chat instead. " +
        "Reply with at most one short guest-facing sentence (tools-only is also fine) either way. Never list room details in text."
      );
    }
    return `Multiple rooms matched (${matchCount}) — Room cards are rendered so the guest can pick one. Do NOT call check_room_availability until a specific room is selected. Reply with ONE short sentence asking them to choose. Never list room names in text.`;
  }

  if (matchCount === 0) {
    return "No rooms matched. Reply with ONE short sentence that nothing matched and suggest changing name/date/guests/level. Do NOT invent rooms. Do NOT say rooms are ready to browse.";
  }

  return `Room cards are already rendered in chat — do NOT call find_room again this turn, do NOT call update_room_list. The room cards ARE the response: do NOT send any chat text at all (no acknowledgement like "I found ${matchCount} room(s)...", no room names, no numbered list, no room details). Tools-only is allowed for this turn.`;
};

export type GetBookingsReplyPurpose = "list" | "resolve" | undefined;

/**
 * Model-facing hint after get_bookings. purpose:"resolve" means the FE
 * suppresses the booking-list card since the HITL that follows (confirm
 * dialog or picker) is the response — not a guest-facing VIEW/LIST turn.
 */
export const buildGetBookingsReplyHint = (
  bookingCount: number,
  purpose: GetBookingsReplyPurpose,
): string => {
  if (purpose === "resolve") {
    if (bookingCount === 0) {
      return "No active bookings matched — the booking-list card is suppressed. Reply with ONE short sentence that there are no matching active bookings. Do NOT invent one from chat history.";
    }
    return "Booking-list card is suppressed for this internal resolve fetch — do NOT say cards were shown or list booking details in text. Continue the cancel/modify workflow with the resolved booking(s) (find_booking_by_id on a single match, or the HITL picker on multiple matches).";
  }

  if (bookingCount === 0) {
    return "No matching active bookings. Reply with ONE short sentence that there are no matching active bookings.";
  }

  return "Booking cards are already rendered in chat — the cards ARE the response: do NOT restate names, dates, or prices in text, and do NOT send an acknowledgement sentence either (tools-only is allowed).";
};

/**
 * create / update / cancel mutation success: same-card HITL Generic UI is the
 * response — no duplicate chat confirmation. Failures still need short chat text.
 */
export const MUTATION_SUCCESS_HITL_REPLY_REQUIREMENT =
  "After success, do NOT send chat text confirming the mutation or restating dates/guests/total/room — the same HITL card already shows success (tools-only is allowed). Still send short chat text only for mutation failures.";

/** @deprecated Prefer MUTATION_SUCCESS_HITL_REPLY_REQUIREMENT */
export const CREATE_BOOKING_CONFIRMATION_REPLY_REQUIREMENT =
  MUTATION_SUCCESS_HITL_REPLY_REQUIREMENT;

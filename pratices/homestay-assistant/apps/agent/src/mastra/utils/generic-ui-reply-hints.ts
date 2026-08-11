/**
 * Model-facing replyHint builders for Generic UI turns.
 * Kept free of path aliases so unit tests can import without the Mastra loader.
 */

export type FindRoomReplyPurpose =
  | "search"
  | "recommend"
  | "book_resolve"
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
  if (purpose === "book_resolve") {
    if (matchCount === 0) {
      return "No room matched that booking name. Reply with ONE short sentence that nothing matched; suggest a different room name. Do NOT invent rooms. Do NOT call check_room_availability.";
    }
    if (matchCount === 1) {
      return (
        "Room resolved for booking — Room List is suppressed (do NOT say cards were shown). " +
        "Extract roomId from rooms[0].id. " +
        "Date continuity (mandatory): if a prior find_room in this conversation already had a date " +
        "(search/recommend echo, e.g. Rooms · YYYY-MM-DD), that date is known checkInDate — " +
        "do NOT ask for check-in again. When check-out / stay length was not given, default " +
        "checkOutDate = checkInDate + 1 day (same window as room search). " +
        "If check-in, check-out (or defaulted), and guests are known → immediately call " +
        "check_room_availability (flow=create) in this same turn. " +
        "If only guests (or another truly unknown field) is missing → ask ONLY for that field " +
        "in ONE short sentence; do NOT re-ask dates that continuity already supplies; " +
        "do NOT call check_room_availability yet. Never list room details in text."
      );
    }
    return `Multiple rooms matched (${matchCount}) — Room cards are rendered so the guest can pick one. Do NOT call check_room_availability until a specific room is selected. Reply with ONE short sentence asking them to choose. Never list room names in text.`;
  }

  if (matchCount === 0) {
    return "No rooms matched. Reply with ONE short sentence that nothing matched and suggest changing name/date/guests/level. Do NOT invent rooms. Do NOT say rooms are ready to browse.";
  }

  return `Room cards are already rendered in chat — do NOT call find_room again this turn, do NOT call update_room_list, and do NOT write room names, a numbered list, or any room details in your reply. Reply with ONE very short sentence only (e.g. "I found ${matchCount} room(s) matching your request."). Never list room names in text.`;
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

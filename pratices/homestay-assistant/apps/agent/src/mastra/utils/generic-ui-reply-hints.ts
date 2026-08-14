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
        "The next tool call is forced to get_room_by_id (Booking Form) by the booking step " +
        "machine — this is automatic, not your choice. Do NOT call check_room_availability or " +
        "confirm_booking from this result, even when check-in, check-out, or guests already " +
        "appear known or stated in the conversation — do NOT invent or assume any of them either. " +
        "Do NOT ask for check-in/check-out/guests in chat. Reply with at most one short " +
        "guest-facing sentence (tools-only is also fine) and let get_room_by_id run next; the " +
        "Booking Form is where the guest sets/confirms dates and guests. Never list room details in text."
      );
    }
    return `Multiple rooms matched (${matchCount}) — Room cards are rendered so the guest can pick one. Do NOT call check_room_availability until a specific room is selected. Reply with ONE short sentence asking them to choose. Never list room names in text.`;
  }

  if (matchCount === 0) {
    return "No rooms matched. Reply with ONE short sentence that nothing matched and suggest changing name/date/guests/level. Do NOT invent rooms. Do NOT say rooms are ready to browse.";
  }

  return `Room cards are already rendered in chat — do NOT call find_room again this turn, do NOT call update_room_list. The room cards ARE the response: do NOT send any chat text at all (no acknowledgement like "I found ${matchCount} room(s)...", no room names, no numbered list, no room details). Tools-only is allowed for this turn.`;
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

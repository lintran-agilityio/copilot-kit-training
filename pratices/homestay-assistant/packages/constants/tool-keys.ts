export const TOOL_KEYS = {
  GET: {
    ROOMS: "get_rooms",
    /**
     * Mastra registration / createTool id / useRenderTool name.
     * Search/filter/recommend rooms by name, date, guests, level.
     */
    FIND_ROOM: "find_room",
  },
  BOOKING: {
    /** Guest-facing "show/list my bookings" — always the full list, no purpose. */
    GET: "get_bookings",
    /** Mastra registration key (LLM tool name) — cancels; gated by suspend() confirmation inside the tool. */
    CANCEL: "cancel_booking",
    /** Mastra createTool id + registration / useRenderTool name — create booking; gated by suspend() confirmation inside the tool. */
    CREATE_BOOKING: "create_booking",
    /** Mastra createTool id + registration / useRenderTool name — update booking; gated by suspend() confirmation inside the tool. */
    UPDATE_BOOKING: "update_booking",
    /** Mastra registration key — fetch room for detail; FE renders via useRenderTool. */
    GET_ROOM_BY_ID: "get_room_by_id",
    /** Mastra registration key — availability check; FE renders unavailable via useRenderTool on fail. */
    CHECK_ROOM_AVAILABILITY: "check_room_availability",
    /**
     * RESOLVE primitive for the BOOK flow — resolves a named room and the
     * stay (checkInDate/checkOutDate/guests), suspending for an ambiguous
     * room name or missing stay input via useInterrupt. Replaces
     * find_room(book_resolve) + get_room_by_id-as-form-opener.
     */
    RESOLVE_STAY: "resolve_booking_stay",
    /**
     * RESOLVE primitive for MODIFY/CANCEL — resolves a booking by id or by
     * room name among active bookings, suspending on an ambiguous match; for
     * purpose:"modify" also suspends for stay-change input when none was
     * stated. Replaces find_bookings + find_booking_by_id +
     * get_bookings(resolve) + show_modify_dialog_select.
     */
    RESOLVE_TARGET: "resolve_booking_target",
  },
  ACTION: {
    /** Frontend generative UI — render the room list from get_rooms/find_room ids. */
    UPDATE_ROOM_LIST: "update_room_list",
  },
};

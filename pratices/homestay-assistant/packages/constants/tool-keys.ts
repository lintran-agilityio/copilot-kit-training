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
    /** Resolve zero, one, or many active booking matches by optional room name. */
    FIND: "find_bookings",
    /** Mastra registration key (LLM tool name) — cancels after show_cancel_dialog_confirm returns confirmed: true. */
    CANCEL: "cancel_booking",
    /** Mastra createTool id + registration / useRenderTool name — create booking; gated by suspend() confirmation inside the tool. */
    CREATE_BOOKING: "create_booking",
    /** Mastra createTool id + registration / useRenderTool name — update booking; gated by suspend() confirmation inside the tool. */
    UPDATE_BOOKING: "update_booking",
    /** Mastra registration key — fetch room for detail; FE renders via useRenderTool. */
    GET_ROOM_BY_ID: "get_room_by_id",
    /** Mastra registration key — availability check; FE renders unavailable via useRenderTool on fail. */
    CHECK_ROOM_AVAILABILITY: "check_room_availability",
    /** Frontend HITL — open cancel confirm dialog (only after find_booking_by_id returns bookings). */
    SHOW_CANCEL_DIALOG_CONFIRM: "show_cancel_dialog_confirm",
    /**
     * Frontend HITL — multi-booking picker when modify has no bookingId and
     * get_bookings returns multiple matches. Guest selects one stay; then
     * find_booking_by_id → edit / stated-modify chain.
     */
    SHOW_MODIFY_DIALOG_SELECT: "show_modify_dialog_select",
    FIND_BY_ID: "find_booking_by_id",
    /**
     * RESOLVE primitive for the BOOK flow — resolves a named room and the
     * stay (checkInDate/checkOutDate/guests), suspending for an ambiguous
     * room name or missing stay input via useInterrupt. Intended to replace
     * find_room(book_resolve) + get_room_by_id-as-form-opener once its tool
     * implementation lands — not yet wired into any tool or the step machine.
     */
    RESOLVE_STAY: "resolve_booking_stay",
    /**
     * RESOLVE primitive for MODIFY/CANCEL — resolves a booking by id or by
     * room name among active bookings, suspending on an ambiguous match; for
     * purpose:"modify" also suspends for stay-change input when none was
     * stated. Intended to replace find_bookings + find_booking_by_id +
     * get_bookings(resolve) + show_modify_dialog_select once its tool
     * implementation lands — not yet wired into any tool or the step machine.
     */
    RESOLVE_TARGET: "resolve_booking_target",
  },
  ACTION: {
    /** Frontend HITL — confirm booking draft after check_room_availability succeeds. */
    CONFIRM_BOOKING: "confirm_booking",
    /**
     * Frontend HITL — edit form with room detail + current dates/guests.
     * Call after find_booking_by_id for modify, before check_room_availability.
     */
    EDIT_MODIFY_BOOKING: "edit_modify_booking",
    /**
     * Frontend HITL — confirm booking modification after availability check
     * with excludeBookingId. Uppercase by convention — matches the literal
     * `nextAction` value check_room_availability/modify-booking.ts return and
     * the render-tool `name` registered in booking-tools.tsx.
     */
    CONFIRM_MODIFY_BOOKING: "CONFIRM_MODIFY_BOOKING",
    /** Frontend generative UI — render the room list from get_rooms/find_room ids. */
    UPDATE_ROOM_LIST: "update_room_list",
  },
};

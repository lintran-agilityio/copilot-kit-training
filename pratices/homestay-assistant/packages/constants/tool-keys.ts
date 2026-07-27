export const TOOL_KEYS = {
  GET: {
    ROOMS: "get_rooms",
    /**
     * Mastra registration / createTool id / useRenderTool name.
     * Search/filter rooms by name, date, guests, level.
     */
    FIND_ROOM: "find_room",
  },
  BOOKING: {
    GET: "get_bookings",
    /** Mastra registration key (LLM tool name) — cancels after show_cancel_dialog_confirm returns confirmed: true. */
    CANCEL: "cancel_booking",
    /** Mastra createTool id + registration / useRenderTool name — create booking after confirm_booking returns confirmed: true. */
    CREATE_BOOKING: "create_booking",
    /** Mastra createTool id + registration / useRenderTool name — update booking after confirm_modify_booking returns confirmed: true. */
    UPDATE_BOOKING: "update_booking",
    /** Mastra registration key — fetch room for detail; FE renders via useRenderTool. */
    GET_ROOM_BY_ID: "get_room_by_id",
    /** Mastra registration key — availability check; FE renders unavailable via useRenderTool on fail. */
    CHECK_ROOM_AVAILABILITY: "check_room_availability",
    /** Frontend HITL — open cancel confirm dialog (only after find_booking_by_id returns bookings). */
    SHOW_CANCEL_DIALOG_CONFIRM: "show_cancel_dialog_confirm",
    FIND_BY_ID: "find_booking_by_id",
  },
  ACTION: {
    /** Frontend HITL — confirm booking draft after check_room_availability succeeds. */
    CONFIRM_BOOKING: "confirm_booking",
    /**
     * Frontend HITL — edit form with room detail + current dates/guests.
     * Call after find_booking_by_id for modify, before check_room_availability.
     */
    EDIT_MODIFY_BOOKING: "edit_modify_booking",
    /** Frontend HITL — confirm booking modification after availability check with excludeBookingId. */
    CONFIRM_MODIFY_BOOKING: "confirm_modify_booking",
    UPDATE_ROOM_LIST: "update_room_list",
  },
};

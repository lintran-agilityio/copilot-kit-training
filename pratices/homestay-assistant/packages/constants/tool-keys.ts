export const TOOL_KEYS = {
  GET: {
    ROOM: "get-room",
    ROOMS: "get-rooms",
    AVAILABLE_ROOMS: "get-available-rooms",
    BOOKINGS: "get-bookings",
  },
  BOOKING: {
    CREATE: "create-booking",
    GET: "get-bookings",
    /** Backend API — cancels after show_cancel_dialog_confirm returns confirmed: true. */
    CANCEL: "cancel-booking",
    /** Frontend HITL — open cancel confirm dialog (only after findBookingById returns bookings). */
    SHOW_CANCEL_DIALOG_CONFIRM: "show_cancel_dialog_confirm",
    FIND_BY_ID: "find_booking_by_id",
    CHECK_AVAILABILITY: "check-room-availability",
  },
  ACTION: {
    /** Generative UI — render RoomDetail inline in chat via useComponent. */
    SHOW_ROOM_DETAIL: "show_room_detail",
    NAVIGATE_TO_HOME_PAGE: "navigate_to_home_page",
    /** Frontend HITL — confirm booking draft after checkRoomAvailability succeeds. */
    CONFIRM_BOOKING: "confirm_booking",
    UPDATE_ROOM_LIST: "update_room_list",
    SET_ROOM_LIST_LOADING: "set_room_list_loading",
    RENDER_ROOM_RESULTS_PREVIEW: "render_room_results_preview",
    SYNC_BOOKING_RESULT: "sync_booking_result",
    UPDATE_BOOKINGS_LIST: "update_bookings_list",
    SHOW_CANCELLATION_SUCCESS: "show_cancellation_success",
    SHOW_BOOKING_SUCCESS: "show_booking_success",
    SHOW_BOOKING_UNAVAILABLE: "show_booking_unavailable",
    SELECT_ROOM_FOR_BOOKING: "select_room_for_booking",
  },
};

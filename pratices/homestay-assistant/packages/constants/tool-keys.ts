export const TOOL_KEYS = {
  GET: {
    ROOM: "get-room",
    ROOM_BY_NAME: "get-room-by-name",
    ROOMS: "get-rooms",
    AVAILABLE_ROOMS: "get-available-rooms",
    BOOKINGS: "get-bookings",
  },
  BOOKING: {
    CREATE: "create-booking",
    GET: "get-bookings",
    /** Backend API — actually cancels after dialog confirm. Must NOT collide with DELETE. */
    CANCEL: "cancel-booking",
    /** Frontend HITL — confirm dialog when booking details are already known. */
    DELETE: "delete-booking",
    /** Frontend HITL — open cancel confirm dialog after findBookingByName. */
    SHOW_CANCEL_DIALOG_CONFIRM: "show_cancel_dialog_confirm",
    FIND_BY_NAME: "find-booking-name",
    CHECK_AVAILABILITY: "check-room-availability",
  },
  ACTION: {
    PICK_ROOM_FOR_DETAIL: "pick-room-for-detail",
    OPEN_ROOM_DETAIL_MODAL: "open_room_detail_modal",
    /** Generative UI — render RoomDetail inline in chat via useComponent. */
    SHOW_ROOM_DETAIL: "show_room_detail",
    NAVIGATE_TO_HOME_PAGE: "navigate_to_home_page",
    OPEN_CONFIRM_BOOKING: "open_confirm_booking",
    UPDATE_ROOM_LIST: "update_room_list",
    SET_ROOM_LIST_LOADING: "set_room_list_loading",
    RENDER_ROOM_RESULTS_PREVIEW: "render_room_results_preview",
    SYNC_BOOKING_RESULT: "sync_booking_result",
    UPDATE_BOOKINGS_LIST: "update_bookings_list",
    NAVIGATE_TO_BOOKINGS_PAGE: "navigate_to_bookings_page",
    SHOW_CANCELLATION_SUCCESS: "show_cancellation_success",
    SHOW_BOOKING_UNAVAILABLE: "show_booking_unavailable",
    SELECT_ROOM_FOR_BOOKING: "select_room_for_booking",
  },
};

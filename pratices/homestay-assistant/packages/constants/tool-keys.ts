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
    /** Mastra registration key (LLM tool name) — cancels after show_cancel_dialog_confirm returns confirmed: true. */
    CANCEL: "cancelBooking",
    /** Mastra registration key — create booking after confirm_booking returns confirmed: true. */
    CREATE_BOOKING: "createBooking",
    /** Mastra registration key — fetch room for detail; FE renders via useRenderTool. */
    GET_ROOM_BY_ID: "getRoomById",
    /** Mastra registration key — availability check; FE renders unavailable via useRenderTool on fail. */
    CHECK_ROOM_AVAILABILITY: "checkRoomAvailability",
    /** Frontend HITL — open cancel confirm dialog (only after findBookingById returns bookings). */
    SHOW_CANCEL_DIALOG_CONFIRM: "show_cancel_dialog_confirm",
    FIND_BY_ID: "find_booking_by_id",
    CHECK_AVAILABILITY: "check-room-availability",
  },
  ACTION: {
    /** @deprecated Room detail renders from getRoomById via useRenderTool. */
    SHOW_ROOM_DETAIL: "show_room_detail",
    /** Frontend HITL — confirm booking draft after checkRoomAvailability succeeds. */
    CONFIRM_BOOKING: "confirm_booking",
    UPDATE_ROOM_LIST: "update_room_list",
    RENDER_ROOM_RESULTS_PREVIEW: "render_room_results_preview",
    /** @deprecated Booking success renders from createBooking via useRenderTool. */
    SHOW_BOOKING_SUCCESS: "show_booking_success",
    /** @deprecated Unavailable renders from checkRoomAvailability via useRenderTool. */
    SHOW_BOOKING_UNAVAILABLE: "show_booking_unavailable",
    SELECT_ROOM_FOR_BOOKING: "select_room_for_booking",
  },
};

import { createTool } from "@mastra/core/tools";
import { TOOL_KEYS } from "@repo/constants";
import {
  cancelBookingByRoomSchema,
  confirmBookingSchema,
  confirmModifyBookingSchema,
  editModifyBookingSchema,
  modifyBookingByRoomSchema,
} from "@repo/schemas";

/**
 * Stand-ins for the frontend-rendered HITL tools (`confirm_booking`,
 * `confirm_modify_booking`, `edit_modify_booking`,
 * `show_cancel_dialog_confirm`, `show_modify_dialog_select`).
 *
 * These are NOT registered on `homestayAssistant.tools` at all (see
 * `src/mastra/agents/homestay-assistant.ts`) — in production they only
 * exist because CopilotKit's `MastraAgent.getLocalAgents()` injects them as
 * client tools from the frontend's `useHumanInTheLoop`/`useRenderTool`
 * registrations. Calling the agent directly (as this suite does, per the
 * brief's "without going through CopilotKit or AG-UI") means the model has
 * no such tool to call unless we supply an equivalent — without it, the
 * booking step-machine's forced transition to e.g. `confirm_booking` has
 * nothing to call, and the model falls through to whatever tool IS
 * registered (often the real mutation tool itself), which would make every
 * "never mutates before confirmation" eval spuriously fail — not because
 * production is broken, but because the harness omitted a tool AG-UI
 * always provides.
 *
 * Each stub has no `execute` (deliberately — `execute` is optional on
 * `createTool`, see `@mastra/core/tools`). A client tool with no `execute`
 * is exactly what a real frontend-rendered tool looks like from the
 * model's side: the call is emitted, the turn ends there awaiting an
 * out-of-band result, and no further steps run — which is precisely the
 * "stop and wait for a real HITL click" behavior this suite asserts.
 * Schemas are the exact shared ones the frontend's `useHumanInTheLoop`
 * hooks use (`@repo/schemas`), so argument shape stays real even though
 * resolution is not.
 */
export const HITL_CLIENT_TOOLS = {
  [TOOL_KEYS.ACTION.CONFIRM_BOOKING]: createTool({
    id: TOOL_KEYS.ACTION.CONFIRM_BOOKING,
    description:
      "Frontend HITL — confirm booking draft after check_room_availability succeeds.",
    inputSchema: confirmBookingSchema,
  }),
  [TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING]: createTool({
    id: TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING,
    description:
      "Frontend HITL — confirm booking modification after availability check with excludeBookingId.",
    inputSchema: confirmModifyBookingSchema,
  }),
  [TOOL_KEYS.ACTION.EDIT_MODIFY_BOOKING]: createTool({
    id: TOOL_KEYS.ACTION.EDIT_MODIFY_BOOKING,
    description:
      "Frontend HITL — edit form with room detail + current dates/guests, before check_room_availability.",
    inputSchema: editModifyBookingSchema,
  }),
  [TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM]: createTool({
    id: TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM,
    description:
      "Frontend HITL — open cancel confirm dialog after a booking is resolved.",
    inputSchema: cancelBookingByRoomSchema,
  }),
  [TOOL_KEYS.BOOKING.SHOW_MODIFY_DIALOG_SELECT]: createTool({
    id: TOOL_KEYS.BOOKING.SHOW_MODIFY_DIALOG_SELECT,
    description:
      "Frontend HITL — multi-booking picker when modify has no bookingId and multiple bookings match.",
    inputSchema: modifyBookingByRoomSchema,
  }),
};

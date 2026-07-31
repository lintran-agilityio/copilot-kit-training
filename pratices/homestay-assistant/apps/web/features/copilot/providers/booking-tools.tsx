"use client";

import { useHumanInTheLoop, useRenderTool } from "@copilotkit/react-core/v2";

import { AGENT_KEYS, TOOL_KEYS } from "@repo/constants";
import {
  CancelBookingByRoomModal,
  CancelBookingNotice,
  BookingUnavailableNotice,
  UpdateBookingNotice,
  CreateBookingNotice,
  ConfirmBookingModal,
  EditModifyBookingModal,
  ConfirmModifyBookingModal,
} from "@/features/booking/components";
import {
  CancelBookingToolProps,
  CheckRoomAvailabilityResult,
  CreateBookingResult,
  UpdateBookingToolProps,
} from "@/features/booking/types";
import {
  cancelBookingByRoomSchema,
  confirmBookingSchema,
  confirmModifyBookingSchema,
  checkRoomAvailabilityInputSchema,
  createBookingInputSchema,
  editModifyBookingSchema,
  updateBookingInputSchema,
  type CancelBookingByRoomArgs,
  type ConfirmBookingArgs,
  type ConfirmModifyBookingArgs,
  type EditModifyBookingArgs,
  cancelBookingInputSchema,
} from "@/features/booking/schemas";

export const BookingToolsProvider = () => {
  useHumanInTheLoop(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.ACTION.CONFIRM_BOOKING,
      description:
        "After check_room_availability succeeds (available true and guestsWithinCapacity true) for a NEW booking, show the confirm booking modal so the guest can approve the draft. Pass result.room from check_room_availability plus check-in, check-out, and guests from that same check. Do NOT call get_room_by_id in a book turn. Do NOT call create_booking until confirm_booking returns confirmed: true. If confirmed: false, reply in chat that the booking was not confirmed. If confirmed: true, call create_booking with roomId, checkInDate, checkOutDate, and guests from the result — the UI shows ConfirmSuccess automatically; then send one short guest-facing chat confirmation. Never use this tool for modifying an existing booking — use confirm_modify_booking instead.",
      parameters: confirmBookingSchema,
      render: ({ status, args, respond }) => (
        <ConfirmBookingModal
          status={status}
          args={args as Partial<ConfirmBookingArgs>}
          respond={respond}
        />
      ),
    },
    [],
  );

  useHumanInTheLoop(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.ACTION.EDIT_MODIFY_BOOKING,
      description:
        "After find_booking_by_id returns a booking for MODIFY, open the edit form in the SAME turn. Pass bookingId, result.room, and the booking's current checkInDate, checkOutDate, and guests from bookings[0]. The guest edits dates/guests in the UI (prefilled). Do NOT ask in chat what to change. Do NOT call get_room_by_id. Do NOT call check_room_availability until edit_modify_booking returns confirmed: true. If confirmed: true, call check_room_availability with roomId, the new dates/guests, and excludeBookingId=bookingId. If confirmed: false, reply that the booking was kept unchanged.",
      parameters: editModifyBookingSchema,
      render: ({ status, args, respond }) => (
        <EditModifyBookingModal
          status={status}
          args={args as Partial<EditModifyBookingArgs>}
          respond={respond}
        />
      ),
    },
    [],
  );

  useHumanInTheLoop(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING,
      description:
        "After check_room_availability succeeds for a MODIFY flow (must have used excludeBookingId), show the read-only confirm modification modal. Pass bookingId, result.room from check_room_availability, and the candidate checkInDate, checkOutDate, and guests from edit_modify_booking. Do NOT call update_booking until confirm_modify_booking returns confirmed: true. If confirmed: true, call update_booking with bookingId, checkInDate, checkOutDate, and guests from the result — the UI shows ConfirmSuccess and refreshes the list automatically; then send one short guest-facing chat confirmation. If confirmed: false, reply that the booking was kept unchanged. Never use this for creating a new booking.",
      parameters: confirmModifyBookingSchema,
      render: ({ status, args, respond }) => (
        <ConfirmModifyBookingModal
          status={status}
          args={args as Partial<ConfirmModifyBookingArgs>}
          respond={respond}
        />
      ),
    },
    [],
  );

  useHumanInTheLoop(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM,
      description:
        "After find_booking_by_id returns bookings.length > 0, show the cancel confirmation dialog with bookings and queryName from the find result as-is. Do NOT call cancel_booking until show_cancel_dialog_confirm returns confirmed: true. If confirmed: true, call cancel_booking with bookingId from the result, then reply in chat confirming the cancellation. Do NOT call get_bookings or show_cancellation_success after cancel — the UI shows success and refreshes the list automatically. If confirmed: false, reply in chat that the booking was kept.",
      parameters: cancelBookingByRoomSchema,
      render: ({ status, args, respond }) => (
        <CancelBookingByRoomModal
          status={status}
          args={args as Partial<CancelBookingByRoomArgs>}
          respond={respond}
        />
      ),
    },
    [],
  );

  useRenderTool(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
      parameters: checkRoomAvailabilityInputSchema,
      render: ({ status, result }) => (
        <BookingUnavailableNotice
          status={status}
          result={result as CheckRoomAvailabilityResult | string | null}
        />
      ),
    },
    [],
  );

  useRenderTool(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.BOOKING.CREATE_BOOKING,
      parameters: createBookingInputSchema,
      render: ({ status, result }) => (
        <CreateBookingNotice
          status={status}
          result={result as CreateBookingResult | string | null}
        />
      ),
    },
    [],
  );

  useRenderTool(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.BOOKING.UPDATE_BOOKING,
      parameters: updateBookingInputSchema,
      render: ({ status, result }) => (
        <UpdateBookingNotice
          status={status}
          result={result as UpdateBookingToolProps["result"]}
        />
      ),
    },
    [],
  );

  useRenderTool(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.BOOKING.CANCEL,
      parameters: cancelBookingInputSchema,
      render: ({ status, result }) => (
        <CancelBookingNotice
          status={status}
          result={result as CancelBookingToolProps["result"]}
        />
      ),
    },
    [],
  );

  return null;
};

"use client";

import { useHumanInTheLoop, useRenderTool } from "@copilotkit/react-core/v2";

import { AGENT_KEYS, TOOL_KEYS } from "@repo/constants";
import {
  cancelBookingInputSchema,
  checkRoomAvailabilityInputSchema,
  createBookingInputSchema,
  updateBookingInputSchema,
} from "@repo/schemas";
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
  editModifyBookingSchema,
  type CancelBookingByRoomArgs,
  type ConfirmBookingArgs,
  type ConfirmModifyBookingArgs,
  type EditModifyBookingArgs,
} from "@/features/booking/schemas";

export const BookingToolsProvider = () => {
  useHumanInTheLoop(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.ACTION.CONFIRM_BOOKING,
      description:
        "Required immediately when a NEW booking availability result (flow=create) returns nextAction=confirm_booking. Show the approval modal using result.room and the same dates/guests. Wait for the response: confirmed=true requires create_booking with the returned fields — the same HITL card then shows submitting/success/failed from create_booking (do not expect a separate success card); confirmed=false stops the booking flow, calls no more tools, and gets a brief 'booking stopped' reply. Never use this for modifying a booking.",
      parameters: confirmBookingSchema,
      render: ({ status, args, respond, result, toolCallId }) => (
        <ConfirmBookingModal
          status={status}
          args={args as Partial<ConfirmBookingArgs>}
          respond={respond}
          result={result}
          toolCallId={toolCallId}
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
        "Open the edit form for a MODIFY only when the guest has NOT already said what to change to. Use it after find_booking_by_id, in the SAME turn: pass bookingId, result.room, and the booking's current checkInDate, checkOutDate, and guests from bookings[0]; the guest then edits dates/guests in the prefilled UI. Do NOT call this tool when the guest already stated the new dates or guest count (e.g. 'change the guests to 4') — instead merge those values over the current booking and call check_room_availability directly with flow=modify and excludeBookingId=bookingId. Do NOT call this tool when the requested guest count exceeds room.capacity — the form cannot select more than capacity, so reply that the room sleeps at most that many guests instead. Do NOT ask in chat what to change. Do NOT call get_room_by_id. When this tool is used, do NOT call check_room_availability until it returns confirmed: true; then call check_room_availability with flow=modify, roomId, the new dates/guests, and excludeBookingId=bookingId. Never use flow=create here. If confirmed: false, reply that the booking was kept unchanged.",
      parameters: editModifyBookingSchema,
      render: ({ status, args, respond, result, toolCallId }) => (
        <EditModifyBookingModal
          status={status}
          args={args as Partial<EditModifyBookingArgs>}
          respond={respond}
          result={result}
          toolCallId={toolCallId}
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
        "After check_room_availability succeeds for a MODIFY flow (flow=modify + excludeBookingId), show the read-only confirm modification modal with before→after diffs and recalculated total. Pass bookingId, result.room, and the SAME checkInDate, checkOutDate, and guests from check_room_availability.result (the values just validated — from edit_modify_booking confirmed:true, or the stated change merged over the booking when the edit form was skipped). Also pass originalCheckInDate, originalCheckOutDate, and originalGuests from check_room_availability.result when present (fallback: edit_modify_booking args or the resolved booking) so the UI can show only changed fields. Never put original booking dates into checkInDate/checkOutDate/guests. Do NOT call update_booking until CONFIRM_MODIFY_BOOKING returns confirmed: true. If confirmed: true, call update_booking with bookingId, checkInDate, checkOutDate, and guests from the result — the same HITL card then shows submitting/success/failed from update_booking (do not expect a separate ConfirmSuccess card); then send one short guest-facing chat confirmation. If confirmed: false, reply that the booking was kept unchanged. Never use this for creating a new booking.",
      parameters: confirmModifyBookingSchema,
      render: ({ status, args, respond, result, toolCallId }) => (
        <ConfirmModifyBookingModal
          status={status}
          args={args as Partial<ConfirmModifyBookingArgs>}
          respond={respond}
          result={result}
          toolCallId={toolCallId}
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
        "After find_booking_by_id returns bookings.length > 0, show the cancel confirmation dialog with bookings and queryName from the find result as-is. Do NOT call cancel_booking until show_cancel_dialog_confirm returns confirmed: true. If confirmed: true, call cancel_booking with bookingId from the result — the same HITL card then shows submitting/success/failed from cancel_booking (do not expect a separate success card); then reply in chat confirming the cancellation. Do NOT call get_bookings or show_cancellation_success after cancel. If confirmed: false, reply in chat that the booking was kept.",
      parameters: cancelBookingByRoomSchema,
      render: ({ status, args, respond, result, toolCallId }) => (
        <CancelBookingByRoomModal
          status={status}
          args={args as Partial<CancelBookingByRoomArgs>}
          respond={respond}
          result={result}
          toolCallId={toolCallId}
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
      render: ({ status, result, parameters }) => (
        <CreateBookingNotice
          status={status}
          result={result as CreateBookingResult | string | null}
          parameters={
            parameters as
              | {
                  roomId?: string;
                  checkInDate?: string;
                  checkOutDate?: string;
                  guests?: number;
                }
              | undefined
          }
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
      render: ({ status, result, parameters }) => (
        <UpdateBookingNotice
          status={status}
          result={result as UpdateBookingToolProps["result"]}
          parameters={
            parameters as
              | {
                  bookingId?: string;
                  checkInDate?: string;
                  checkOutDate?: string;
                  guests?: number;
                }
              | undefined
          }
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
      render: ({ status, result, parameters }) => (
        <CancelBookingNotice
          status={status}
          result={result as CancelBookingToolProps["result"]}
          parameters={
            parameters as { bookingId?: string } | undefined
          }
        />
      ),
    },
    [],
  );

  return null;
};

"use client";

import { useHumanInTheLoop, useRenderTool } from "@copilotkit/react-core/v2";

import { AGENT_KEYS, TOOL_KEYS } from "@repo/constants";
import {
  cancelBookingInputSchema,
  checkRoomAvailabilityInputSchema,
  createBookingInputSchema,
  updateBookingInputSchema,
  getBookingsInputSchema,
  cancelBookingByRoomSchema,
  modifyBookingByRoomSchema,
  confirmBookingSchema,
  confirmModifyBookingSchema,
  editModifyBookingSchema,
  type CancelBookingByRoomArgs,
  type ModifyBookingByRoomArgs,
  type ConfirmBookingArgs,
  type EditModifyBookingArgs,
} from "@repo/schemas";
import { MODEL_NAME } from "@repo/types";
import {
  CancelBookingByRoomModal,
  ModifyBookingByRoomModal,
  CancelBookingNotice,
  BookingUnavailableNotice,
  UpdateBookingNotice,
  CreateBookingNotice,
  ConfirmBookingModal,
  EditModifyBookingModal,
  MyBookingsNotice,
} from "@/features/booking/components";
import {
  CancelBookingToolProps,
  CheckRoomAvailabilityResult,
  CreateBookingToolProps,
  UpdateBookingToolProps,
  GetBookingsResult,
} from "@/features/booking/types";
import type { ToolRendererProps } from "@/features/copilot/types/tool-render-props";
import { HitlConfirmStayModal } from "@/features/booking/components/HitlConfirmStayModal";

export const BookingToolsProvider = () => {
  useHumanInTheLoop(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
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
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.ACTION.EDIT_MODIFY_BOOKING,
      description:
        "Edit form for MODIFY — the app only routes you here when the guest has not stated a new value (a stated value skips this form entirely). Pass the authoritative bookingId, room, and current dates/guests straight from the find_booking_by_id result you just received. On confirmed:true, the app forces the next call to check_room_availability with the guest-edited stay and excludeBookingId=bookingId — you do not need to construct that call's args. If confirmed:false, keep the booking unchanged.",
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
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.ACTION.CONFIRM_MODIFY_BOOKING,
      description:
        "After check_room_availability returns nextAction=CONFIRM_MODIFY_BOOKING, show the read-only before→after card. Pass { bookingId, room, checkInDate, checkOutDate, guests } from check_room_availability.result, plus originalCheckInDate/originalCheckOutDate/originalGuests from that same result when present — never reconstruct, merge, or replace any field from UI state or memory. Wait for explicit confirmation. On confirmed:true, the app forces the next call to update_booking with the confirmed fields. On confirmed:false, call no mutation and keep the booking unchanged.",
      parameters: confirmModifyBookingSchema,
      render: ({ status, args, respond, result, toolCallId }) => (
        <HitlConfirmStayModal
          variant={MODEL_NAME.MODIFY}
          status={status}
          args={args}
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
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM,
      description:
        "After find_booking_by_id (or find_bookings, resolved/ambiguous) returns bookings.length > 0, show the cancel confirmation dialog with bookings and queryName from the find result as-is. Do NOT call cancel_booking until show_cancel_dialog_confirm returns confirmed: true. If confirmed: true, call cancel_booking with bookingId from the result — the same HITL card then shows submitting/success/failed from cancel_booking (do not expect a separate success card); on success do NOT send chat confirmation text. Do NOT call get_bookings, find_bookings, or show_cancellation_success after cancel. If confirmed: false, reply in chat that the booking was kept.",
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

  useHumanInTheLoop(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.BOOKING.SHOW_MODIFY_DIALOG_SELECT,
      description:
        "After find_bookings returns status: \"ambiguous\" for a MODIFY without bookingId, show the selectable list. Pass ONLY { bookingIds: [all ids from find_bookings' bookings], queryName } — do NOT send full bookings[] rows (tool args truncate). The UI hydrates dates/prices from find_bookings. Do NOT pick the first booking. Do NOT ask which in chat — the HITL list is the response. When confirmed: true, call find_booking_by_id with bookingId from the result, then continue edit_modify_booking (or stated-change availability). When confirmed: false, reply that bookings were kept unchanged. Never call update_booking from this tool.",
      parameters: modifyBookingByRoomSchema,
      render: ({ status, args, respond, result, toolCallId }) => (
        <ModifyBookingByRoomModal
          status={status}
          args={args as Partial<ModifyBookingByRoomArgs>}
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
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.BOOKING.GET,
      parameters: getBookingsInputSchema,
      render: ({ status, result, parameters, toolCallId }) => (
        <MyBookingsNotice
          status={status}
          result={result as GetBookingsResult | string | null}
          parameters={
            parameters as { purpose?: GetBookingsResult["purpose"] } | undefined
          }
          toolCallId={toolCallId}
        />
      ),
    },
    [],
  );

  useRenderTool(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.BOOKING.CHECK_ROOM_AVAILABILITY,
      parameters: checkRoomAvailabilityInputSchema,
      render: ({ status, result }) => {
        const props: ToolRendererProps<CheckRoomAvailabilityResult> = {
          status,
          result: result as CheckRoomAvailabilityResult | string | null,
        };
        return <BookingUnavailableNotice {...props} />;
      },
    },
    [],
  );

  useRenderTool(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.BOOKING.CREATE_BOOKING,
      parameters: createBookingInputSchema,
      render: ({ status, result, parameters }) => {
        const props: CreateBookingToolProps = {
          status,
          result: result as CreateBookingToolProps["result"],
          parameters: parameters as CreateBookingToolProps["parameters"],
        };
        return <CreateBookingNotice {...props} />;
      },
    },
    [],
  );

  useRenderTool(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.BOOKING.UPDATE_BOOKING,
      parameters: updateBookingInputSchema,
      render: ({ status, result, parameters }) => {
        const props: UpdateBookingToolProps = {
          status,
          result: result as UpdateBookingToolProps["result"],
          parameters: parameters as UpdateBookingToolProps["parameters"],
        };
        return <UpdateBookingNotice {...props} />;
      },
    },
    [],
  );

  useRenderTool(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.BOOKING.CANCEL,
      parameters: cancelBookingInputSchema,
      render: ({ status, result, parameters }) => {
        const props: CancelBookingToolProps = {
          status,
          result: result as CancelBookingToolProps["result"],
          parameters: parameters as CancelBookingToolProps["parameters"],
        };
        return <CancelBookingNotice {...props} />;
      },
    },
    [],
  );

  return null;
};

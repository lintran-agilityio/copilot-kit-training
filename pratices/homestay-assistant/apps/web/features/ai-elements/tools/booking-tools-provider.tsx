"use client";

import { useHumanInTheLoop, useRenderTool } from "@copilotkit/react-core/v2";

import { AGENT_KEYS, TOOL_KEYS } from "@repo/constants";
import {
  CancelBookingByRoomModal,
  CancelBookingToolRenderer,
  CancelBookingRefreshEffect,
  CheckRoomAvailabilityToolRenderer,
  ConfirmBookingModal,
  CreateBookingToolRenderer,
} from "@/features/ai-elements/components";
import type {
  CancelBookingToolProps,
  CheckRoomAvailabilityResult,
  CreateBookingResult,
} from "@/features/ai-elements/type";
import {
  cancelBookingByRoomSchema,
  confirmBookingSchema,
  checkRoomAvailabilityInputSchema,
  createBookingInputSchema,
  type CancelBookingByRoomArgs,
  type ConfirmBookingArgs,
  cancelBookingInputSchema,
} from "@/features/booking/schemas";

export const BookingToolsProvider = () => {
  useHumanInTheLoop(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.ACTION.CONFIRM_BOOKING,
      description:
        "After checkRoomAvailability succeeds (available true and guestsWithinCapacity true), show the confirm booking modal so the guest can approve the draft. Pass result.room from checkRoomAvailability plus check-in, check-out, and guests from that same check. Do NOT call getRoomById in a book turn. Do NOT call createBooking until confirm_booking returns confirmed: true. If confirmed: false, reply in chat that the booking was not confirmed. If confirmed: true, call createBooking with roomId, checkInDate, checkOutDate, and guests from the result — the UI shows ConfirmSuccess automatically; then send one short guest-facing chat confirmation.",
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
      name: TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM,
      description:
        "After findBookingById returns bookings.length > 0, show the cancel confirmation dialog with bookings and queryName from the find result as-is. Do NOT call cancelBooking until show_cancel_dialog_confirm returns confirmed: true. If confirmed: true, call cancelBooking with bookingId from the result, then reply in chat confirming the cancellation. Do NOT call getBookings or show_cancellation_success after cancel — the UI shows success and refreshes the list automatically. If confirmed: false, reply in chat that the booking was kept.",
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
        <CheckRoomAvailabilityToolRenderer
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
        <CreateBookingToolRenderer
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
      name: TOOL_KEYS.BOOKING.CANCEL,
      parameters: cancelBookingInputSchema,
      render: ({ status, result }) => (
        <>
          <CancelBookingRefreshEffect
            status={status}
            result={result as CancelBookingToolProps["result"]}
          />
          <CancelBookingToolRenderer
            status={status}
            result={result as CancelBookingToolProps["result"]}
          />
        </>
      ),
    },
    [],
  );

  return null;
};

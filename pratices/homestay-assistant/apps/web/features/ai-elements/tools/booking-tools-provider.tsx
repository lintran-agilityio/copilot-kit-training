"use client";

import { useHumanInTheLoop, useRenderTool } from "@copilotkit/react-core/v2";

import { AGENT_KEYS, TOOL_KEYS } from "@repo/constants";
import {
  BookingUnavailableModal,
  BookingSuccessModal,
  CancelBookingByRoomModal,
  CancelBookingToolRenderer,
  ConfirmBookingModal,
  CancelBookingRefreshEffect,
} from "@/features/ai-elements/components";
import type { CancelBookingToolProps } from "@/features/ai-elements/type";
import {
  cancelBookingByRoomSchema,
  confirmBookingSchema,
  showBookingUnavailableSchema,
  showBookingSuccessSchema,
  type CancelBookingByRoomArgs,
  type ConfirmBookingArgs,
  type ShowBookingUnavailableArgs,
  type ShowBookingSuccessArgs,
  cancelBookingInputSchema,
} from "@/features/booking/schemas";

export const BookingToolsProvider = () => {
  useHumanInTheLoop(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.ACTION.SHOW_BOOKING_UNAVAILABLE,
      description:
        "Show BookingUnavailableModal when checkRoomAvailability fails (available false or guestsWithinCapacity false). Pass room name, dates, guests, and reason (dates_unavailable or capacity_exceeded; include capacity for capacity_exceeded). Do NOT send the guest-facing chat explanation in the same step — wait until the guest closes the modal (acknowledged: true), THEN reply in chat explaining what happened and offering different dates, fewer guests, or another room.",
      parameters: showBookingUnavailableSchema,
      render: ({ status, args, respond }) => (
        <BookingUnavailableModal
          status={status}
          args={args as Partial<ShowBookingUnavailableArgs>}
          respond={respond}
        />
      ),
    },
    [],
  );

  useHumanInTheLoop(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.ACTION.CONFIRM_BOOKING,
      description:
        "After checkRoomAvailability succeeds (available true and guestsWithinCapacity true), show the confirm booking modal so the guest can approve the draft. Pass result.room from checkRoomAvailability plus check-in, check-out, and guests from that same check. Do NOT call getRoomById or show_room_detail in a book turn. Do NOT call createBooking until confirm_booking returns confirmed: true. If confirmed: false, reply in chat that the booking was not confirmed. If confirmed: true, call createBooking with roomId, checkInDate, checkOutDate, and guests from the result, then show_booking_success — wait for acknowledged: true before final chat.",
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

  useHumanInTheLoop(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.ACTION.SHOW_BOOKING_SUCCESS,
      description:
        "Show BookingSuccessModal in chat after createBooking succeeds. Pass checkInDate, checkOutDate, guests, and totalPrice from the createBooking result. Do NOT send the guest-facing chat confirmation in the same step — wait until the guest closes the modal (acknowledged: true), THEN reply in chat confirming the stay is booked and offer to view bookings or help with something else.",
      parameters: showBookingSuccessSchema,
      render: ({ status, args, respond }) => (
        <BookingSuccessModal
          status={status}
          args={args as Partial<ShowBookingSuccessArgs>}
          respond={respond}
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

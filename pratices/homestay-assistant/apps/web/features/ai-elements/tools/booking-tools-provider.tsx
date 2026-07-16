"use client";

import { useFrontendTool, useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { useEffect, useState } from "react";

import { AGENT_KEYS, TOOL_KEYS } from "@repo/constants";
import {
  BookingUnavailableModal,
  BookingSuccessModal,
  CancelBookingByRoomModal,
  ConfirmBookingModal,
  ConfirmDeleteSuccessModal,
} from "@/features/ai-elements/components";
import {
  showCancellationSuccessUi,
  syncBookingResultToStore,
  syncBookingsListToStore,
} from "@/features/booking/copilot/booking-ui";
import {
  cancelBookingByRoomSchema,
  confirmBookingSchema,
  showBookingUnavailableSchema,
  showBookingSuccessSchema,
  showCancellationSuccessSchema,
  syncBookingResultSchema,
  updateBookingsListSchema,
  type CancelBookingByRoomArgs,
  type ConfirmBookingArgs,
  type ShowBookingUnavailableArgs,
  type ShowBookingSuccessArgs,
} from "@/features/booking/schemas";
import type { BookingResponse } from "@/features/booking/types";
import { useBookingsStore } from "@/features/booking/stores/booking-store";

const BookingCancellationNotice = () => {
  const noticeCancellation = useBookingsStore((state) => state.cancellationNotice);
  const setCancellationNotice = useBookingsStore(
    (state) => state.setCancellationNotice,
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (noticeCancellation) {
      setOpen(true);
    }
  }, [noticeCancellation]);

  if (!noticeCancellation) {
    return null;
  }

  return (
    <ConfirmDeleteSuccessModal
      open={open}
      roomName={noticeCancellation.roomName}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setCancellationNotice(null);
        }
      }}
    />
  );
};

export const BookingToolsProvider = () => {
  useFrontendTool(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.ACTION.SYNC_BOOKING_RESULT,
      description:
        "Sync createBooking result to the booking store. On success pass { status: \"success\", booking: <createBooking result> } exactly. On failure pass { status: \"error\", errorMessage }. This does NOT show the success modal — you MUST call show_booking_success next with checkInDate, checkOutDate, guests, and totalPrice from the booking, then wait for acknowledged: true before sending final chat.",
      parameters: syncBookingResultSchema,
      handler: async (args) => syncBookingResultToStore(args),
    },
    [],
  );

  useFrontendTool(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.ACTION.UPDATE_BOOKINGS_LIST,
      description:
        "Update the My Bookings page list. Pass bookings from getBookings as-is. After this succeeds, always send one short guest-facing chat sentence — list sync alone is not a complete reply.",
      parameters: updateBookingsListSchema,
      handler: async ({ bookings }) =>
        syncBookingsListToStore(bookings as BookingResponse[]),
    },
    [],
  );

  useFrontendTool(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.ACTION.SHOW_CANCELLATION_SUCCESS,
      description:
        "Show a brief cancellation success notice after cancel-booking succeeds. Always also send one short guest-facing chat confirmation.",
      parameters: showCancellationSuccessSchema,
      handler: async ({ roomName }) => showCancellationSuccessUi(roomName),
    },
    [],
  );

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
        "After checkRoomAvailability succeeds (available true and guestsWithinCapacity true), show the confirm booking modal so the guest can approve the draft. Pass result.room from checkRoomAvailability plus check-in, check-out, and guests from that same check. Do NOT call getRoomById or show_room_detail in a book turn. Do NOT call createBooking until confirm_booking returns confirmed: true. If confirmed: false, reply in chat that the booking was not confirmed. If confirmed: true, call createBooking with roomId, checkInDate, checkOutDate, and guests from the result, then sync_booking_result, then show_booking_success — wait for acknowledged: true before final chat.",
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
        "After findBookingById returns bookings.length > 0, show the cancel confirmation dialog with bookings and queryName from the find result as-is. Do NOT call cancelBooking until show_cancel_dialog_confirm returns confirmed: true. If confirmed: true, call cancelBooking with bookingId from the result, then getBookings → update_bookings_list → show_cancellation_success with the room name. If confirmed: false, reply in chat that the booking was kept.",
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
        "Show BookingSuccessModal in chat after sync_booking_result succeeds. Pass checkInDate, checkOutDate, guests, and totalPrice from the createBooking result. Do NOT send the guest-facing chat confirmation in the same step — wait until the guest closes the modal (acknowledged: true), THEN reply in chat confirming the stay is booked and offer to view bookings or help with something else.",
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

  return <BookingCancellationNotice />;
};

"use client";

import { useRouter } from "next/navigation";
import { useFrontendTool, useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { useEffect, useState } from "react";

import { AGENT_KEYS, TOOL_KEYS } from "@repo/constants";
import { ROUTES } from "@/constants";
import {
  BookingUnavailableModal,
  CancelBookingByRoomModal,
  ConfirmDeleteBookingModal,
  ConfirmDeleteSuccessModal,
} from "@/features/ai-elements/components";
import {
  showCancellationSuccessUi,
  syncBookingResultToStore,
  syncBookingsListToStore,
} from "@/features/booking/copilot/booking-ui";
import {
  cancelBookingByRoomSchema,
  confirmDeleteBookingSchema,
  showBookingUnavailableSchema,
  showCancellationSuccessSchema,
  syncBookingResultSchema,
  updateBookingsListSchema,
  type CancelBookingByRoomResult,
  type ShowBookingUnavailableArgs,
} from "@/features/booking/schemas";
import type { BookingDetails, BookingResponse } from "@/features/booking/types";
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
  const router = useRouter();

  useFrontendTool(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.ACTION.SYNC_BOOKING_RESULT,
      description:
        "Sync createBooking result to the room detail modal. Pass booking from createBooking on success.",
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
      name: TOOL_KEYS.ACTION.NAVIGATE_TO_BOOKINGS_PAGE,
      description:
        "Navigate to the My Bookings page. No parameters needed. Navigation alone is not a complete reply — always also send one short guest-facing chat sentence (e.g. bookings are open).",
      handler: async () => {
        router.push(ROUTES.BOOKINGS);
        return "Navigated to My Bookings page.";
      },
    },
    [router],
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
      name: TOOL_KEYS.BOOKING.SHOW_CANCEL_DIALOG_CONFIRM,
      description:
        "Open the cancel-booking confirm dialog ONLY after findBookingByName returns bookings.length > 0. Pass bookings and queryName as-is. In the SAME turn, also send one short guest-facing chat sentence that the dialog is ready. Do NOT call this when bookings is empty — the agent must reply in chat instead. Do NOT call cancelBooking yet. After confirmed: true, call cancelBooking → getBookings → update_bookings_list → show_cancellation_success, then a short chat confirmation.",
      parameters: cancelBookingByRoomSchema,
      render: ({ status, args, respond, result }) => {
        const cancelResult = result as CancelBookingByRoomResult | undefined;

        return (
          <CancelBookingByRoomModal
            status={status}
            args={args}
            respond={respond}
            result={cancelResult}
          />
        );
      },
    },
    [],
  );

  useHumanInTheLoop(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.BOOKING.DELETE,
      description:
        "Ask the guest to confirm cancelling when you already have full booking details. In the SAME turn, also send one short guest-facing chat sentence. Do NOT call cancelBooking yet. After confirmed: true, call cancelBooking → getBookings → update_bookings_list → show_cancellation_success, then a short chat confirmation.",
      parameters: confirmDeleteBookingSchema,
      render: ({ status, args, respond }) => (
        <ConfirmDeleteBookingModal
          status={status}
          bookingItem={args as BookingDetails}
          respond={respond}
        />
      ),
    },
    [],
  );

  return <BookingCancellationNotice />;
};

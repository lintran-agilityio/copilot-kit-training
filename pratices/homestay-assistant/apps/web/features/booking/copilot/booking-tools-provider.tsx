"use client";

import { useRouter } from "next/navigation";
import { useFrontendTool, useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { useEffect, useState } from "react";

import { AGENT_KEYS, TOOL_KEYS } from "@repo/constants";
import { ROUTES } from "@/constants";
import {
  CancelBookingByRoomModal,
  ConfirmDeleteBookingModal,
  ConfirmDeleteSuccessModal,
} from "@/features/booking/components";
import {
  showCancellationSuccessUi,
  syncBookingResultToStore,
  syncBookingsListToStore,
} from "@/features/booking/copilot/booking-ui";
import {
  cancelBookingByRoomSchema,
  confirmDeleteBookingSchema,
  showCancellationSuccessSchema,
  syncBookingResultSchema,
  updateBookingsListSchema,
  type CancelBookingByRoomResult,
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
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.ACTION.SYNC_BOOKING_RESULT,
      description:
        "Sync createBooking result to the room detail drawer. Pass booking from createBooking on success.",
      parameters: syncBookingResultSchema,
      handler: async (args) => syncBookingResultToStore(args),
    },
    [],
  );

  useFrontendTool(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.ACTION.UPDATE_BOOKINGS_LIST,
      description:
        "Update the My Bookings page list. Pass bookings from getBookings as-is.",
      parameters: updateBookingsListSchema,
      handler: async ({ bookings }) =>
        syncBookingsListToStore(bookings as BookingResponse[]),
    },
    [],
  );

  useFrontendTool(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.ACTION.NAVIGATE_TO_BOOKINGS_PAGE,
      description: "Navigate to the My Bookings page. No parameters needed.",
      handler: async () => {
        router.push(ROUTES.BOOKINGS);
        return "Navigated to My Bookings page.";
      },
    },
    [router],
  );

  useFrontendTool(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.ACTION.SHOW_CANCELLATION_SUCCESS,
      description:
        "Show a brief cancellation success notice after cancelBooking succeeds.",
      parameters: showCancellationSuccessSchema,
      handler: async ({ roomName }) => showCancellationSuccessUi(roomName),
    },
    [],
  );

  useHumanInTheLoop(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.BOOKING.CANCEL_BY_ROOM,
      description:
        "Show a cancellation dialog after findBookingByRoom. Pass bookings and queryName from findBookingByRoom. On confirm, agent must call cancelBooking then update_bookings_list.",
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
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.BOOKING.DELETE,
      description:
        "Ask the user to confirm cancelling a booking when you already have full booking details. On confirm, agent must call cancelBooking then update_bookings_list.",
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

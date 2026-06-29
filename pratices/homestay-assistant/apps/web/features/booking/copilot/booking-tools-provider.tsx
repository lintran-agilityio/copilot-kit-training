"use client";

import { useRouter } from "next/navigation";
import { ToolCallStatus, useFrontendTool, useHumanInTheLoop } from "@copilotkit/react-core/v2";

import { AGENT_KEYS, TOOL_KEYS } from "@repo/constants";
import { ROUTES } from "@/constants";
import {
  CancelBookingByRoomModal,
  ConfirmDeleteBookingModal,
  ConfirmDeleteSuccessModal,
} from "@/features/booking/components";
import {
  cancelBookingByRoomSchema,
  confirmDeleteBookingSchema,
  type CancelBookingByRoomResult,
  type ConfirmDeleteBookingResult,
} from "@/features/booking/schemas";
import type { BookingDetails } from "@/features/booking/types";
import { refreshBookedRooms } from "../utils";

export const BookingToolsProvider = () => {
  const router = useRouter();

  useFrontendTool(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.ACTION.OPEN_BOOKINGS_PAGE,
      description:
        "Show the user's booked rooms on the My Bookings page. No parameters needed.",
      handler: async () => {
        const bookedRooms = await refreshBookedRooms();
        router.push(ROUTES.BOOKINGS);

        if (!bookedRooms.length) {
          return "Opened My Bookings. You have no booked rooms yet.";
        }

        return `Opened My Bookings with ${bookedRooms.length} booked room(s).`;
      },
    },
    [router],
  );

  useHumanInTheLoop(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.BOOKING.CANCEL_BY_ROOM,
      description:
        "Show a cancellation dialog after findBookingByRoom. Pass the full lookup result (status, message, booking or candidates). Use only after calling findBookingByRoom.",
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
        "Ask the user to confirm cancelling a booking when you already have the full booking details (bookingId, roomName, dates, guests, totalPrice).",
      parameters: confirmDeleteBookingSchema,
      render: ({ status, args, respond, result }) => {
        const deleteResult = result as ConfirmDeleteBookingResult | undefined;

        if (status === ToolCallStatus.Complete && deleteResult?.confirmed) {
          return <ConfirmDeleteSuccessModal />;
        }

        return (
          <ConfirmDeleteBookingModal
            status={status}
            bookingItem={args as BookingDetails}
            respond={respond}
          />
        );
      },
    },
    [],
  );

  return null;
};

"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useFrontendTool } from "@copilotkit/react-core/v2";

import { AGENT_KEYS, TOOL_KEYS } from "@repo/constants";
import { ROUTES } from "@/constants";
import { getMyBookings } from "@/features/booking/services";
import { useRoomStore } from "@/features/room/stores/room-store";
import { mappingBookedToRooms } from "../utils";

const BOOKED_ROOMS_TITLE = "Room are booked";

export const BookingToolsProvider = () => {
  const router = useRouter();
  const { userId } = useAuth();

  useFrontendTool(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.ACTION.OPEN_BOOKINGS_PAGE,
      description:
        "Show the user's booked rooms on the My Bookings page. No parameters needed.",
      handler: async () => {
        const bookings = await getMyBookings(userId ?? '');

        const bookedRooms = mappingBookedToRooms(bookings);

        useRoomStore
          .getState()
          .updateRoomList(bookedRooms, BOOKED_ROOMS_TITLE);
        router.push(ROUTES.BOOKINGS);

        if (!bookedRooms.length) {
          return "Opened My Bookings. You have no booked rooms yet.";
        }

        return `Opened My Bookings with ${bookedRooms.length} booked room(s).`;
      },
    },
    [router],
  );

  return null;
};

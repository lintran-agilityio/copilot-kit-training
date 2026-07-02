"use client";

import { usePathname, useRouter } from "next/navigation";
import { useFrontendTool, useHumanInTheLoop } from "@copilotkit/react-core/v2";

import { AGENT_KEYS, TOOL_KEYS } from "@repo/constants";
import { useBooking } from "@/features/booking/hooks";
import { PickRoomForDetailModal } from "@/features/room/components";
import {
  openRoomDetailDrawerSchema,
  pickRoomForDetailSchema,
  selectRoomForBookingSchema,
  updateBookingFormSchema,
  updateRoomListSchema,
} from "@/features/room/schemas";
import type { Room } from "@/features/room/types/room";

import {
  formatRoomListSyncResult,
  syncRoomListToStore,
} from "./room-list-ui";
import {
  formatOpenRoomDetailResult,
  openRoomDetailDrawerUi,
} from "./room-detail-ui";
import { navigateToHomeIfNeeded } from "@/utils";

export const RoomToolsProvider = () => {
  const router = useRouter();
  const pathname = usePathname();
  const setSelectedRoom = useBooking((state) => state.setSelectedRoom);
  const updateBookingForm = useBooking((state) => state.updateBookingForm);

  useFrontendTool(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.ACTION.UPDATE_ROOM_LIST,
      description:
        "Update the room grid on the home page. Pass rooms from getRooms or getAvailableRooms as-is.",
      parameters: updateRoomListSchema,
      handler: async ({ rooms, title }) => {
        syncRoomListToStore(rooms, title);
        return formatRoomListSyncResult(rooms, title);
      },
    },
    [],
  );

  useFrontendTool(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.ACTION.NAVIGATE_TO_HOME_PAGE,
      description:
        "Navigate to the home page so the room grid is visible. No parameters needed.",
      handler: async () => {
        navigateToHomeIfNeeded(pathname, router);
        return "Navigated to home page.";
      },
    },
    [pathname, router],
  );

  useFrontendTool(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.ACTION.OPEN_ROOM_DETAIL_DRAWER,
      description:
        "Open the room detail drawer. Pass the full room object from getRoomByName or getRoomById as-is.",
      parameters: openRoomDetailDrawerSchema,
      handler: async ({ room }) => {
        openRoomDetailDrawerUi(room);
        return formatOpenRoomDetailResult(room);
      },
    },
    [],
  );

  useFrontendTool(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.ACTION.SELECT_ROOM_FOR_BOOKING,
      description:
        "Stage a room on the booking draft while collecting missing booking details in chat.",
      parameters: selectRoomForBookingSchema,
      handler: async ({ id, name, pricePerNight, capacity }) => {
        setSelectedRoom({ id, name, pricePerNight, capacity });
        return `Staged ${name} on the booking draft.`;
      },
    },
    [setSelectedRoom],
  );

  useFrontendTool(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.ACTION.UPDATE_BOOKING_FORM,
      description:
        "Update the booking form in the room detail drawer after availability is confirmed. Opens the drawer for user review.",
      parameters: updateBookingFormSchema,
      handler: async ({ room, checkInDate, checkOutDate, guests }) => {
        updateBookingForm({
          room: {
            id: room.id,
            name: room.name,
            pricePerNight: room.pricePerNight,
            capacity: room.capacity,
          },
          checkInDate,
          checkOutDate,
          guests,
        });
        openRoomDetailDrawerUi(room as Room);

        return `Updated booking form for ${room.name}. The room detail drawer is open for review.`;
      },
      followUp: false,
    },
    [updateBookingForm],
  );

  useHumanInTheLoop(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.ACTION.PICK_ROOM_FOR_DETAIL,
      description:
        "Show a room picker when getRoomByName returns multiple rooms. Pass rooms and queryName from getRoomByName. Returns the user's chosen room — then call navigate_to_home_page and open_room_detail_drawer.",
      parameters: pickRoomForDetailSchema,
      render: ({ status, args, respond }) => (
        <PickRoomForDetailModal
          status={status}
          args={args}
          respond={respond}
        />
      ),
    },
    [],
  );

  return null;
};

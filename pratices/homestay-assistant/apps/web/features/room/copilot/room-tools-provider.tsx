"use client";

import { usePathname, useRouter } from "next/navigation";
import { useFrontendTool, useHumanInTheLoop } from "@copilotkit/react-core/v2";

import { AGENT_KEYS, TOOL_KEYS } from "@repo/constants";
import { ROUTES } from "@/constants";
import { useBooking } from "@/features/booking/hooks";
import { PickRoomForDetailModal } from "@/features/room/components";
import {
  openRoomDetailDrawerSchema,
  pickRoomForDetailSchema,
  selectRoomForBookingSchema,
  showAvailableRoomsSchema,
  updateBookingFormSchema,
} from "@/features/room/schemas";
import { useRoomStore } from "@/features/room/stores/room-store";
import type { Room } from "@/features/room/types/room";
import { getRooms, getRoomById } from "../services";
import { PREFIX_URL } from "@/types";

const navigateToHomeIfNeeded = (
  pathname: string,
  router: ReturnType<typeof useRouter>,
) => {
  if (pathname === ROUTES.BOOKINGS) {
    router.push(ROUTES.HOME);
  }
};

export const RoomToolsProvider = () => {
  const router = useRouter();
  const pathname = usePathname();
  const setSelectedRoom = useBooking((state) => state.setSelectedRoom);
  const updateBookingForm = useBooking((state) => state.updateBookingForm);

  useFrontendTool(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.ACTION.SHOW_ALL_ROOMS_PAGE,
      description:
        "Show all rooms on the home page. No parameters needed.",
      handler: async () => {
        const rooms = await getRooms({
          via: PREFIX_URL.WEB,
        });
        useRoomStore.getState().updateRoomList(rooms, undefined);
        navigateToHomeIfNeeded(pathname, router);

        return `Showing ${rooms.length} room(s) on the home page.`;
      },
    },
    [pathname, router],
  );

  useFrontendTool(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.ACTION.SHOW_AVAILABLE_ROOMS_PAGE,
      description:
        "Show available rooms on the home page for a check-in date.",
      parameters: showAvailableRoomsSchema,
      handler: async ({ date }) => {
        const checkInDate =
          date ?? new Date().toISOString().slice(0, 10);

        const rooms = await getRooms({
          via: PREFIX_URL.WEB,
          date: checkInDate
        });
        useRoomStore.getState().updateRoomList(rooms, "Available rooms");
        navigateToHomeIfNeeded(pathname, router);

        return `Showing ${rooms.length} available room(s) for ${checkInDate}.`;
      },
    },
    [pathname, router],
  );

  useFrontendTool(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.ACTION.OPEN_ROOM_DETAIL_DRAWER,
      description:
        "Open the room detail drawer. Prefer passing the full room object from getRoomByName. Use roomId only as a fallback.",
      parameters: openRoomDetailDrawerSchema,
      handler: async ({ room, roomId }) => {
        const resolvedRoom =
          room ??
          (await getRoomById({
            via: PREFIX_URL.WEB,
            roomId: roomId!,
          }));

        useRoomStore.getState().openRoomDetailDrawer(resolvedRoom);

        return `Opened room detail drawer for ${resolvedRoom.name}.`;
      },
    },
    [],
  );

  useFrontendTool(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: "selectRoomForBooking",
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
        useRoomStore.getState().openRoomDetailDrawer(room as Room);

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
        "Show a room picker when getRoomByName returns multiple rooms. Pass rooms and queryName from getRoomByName. Use only when rooms.length > 1.",
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

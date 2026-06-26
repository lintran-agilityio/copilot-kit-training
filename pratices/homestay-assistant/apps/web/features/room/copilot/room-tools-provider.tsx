"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";

import { AGENT_KEYS, TOOL_KEYS } from "@repo/constants";
import { useBooking } from "@/features/booking/hooks/use-booking";
import {
  selectRoomForBookingSchema,
  updateBookingFormSchema,
} from "@/features/room/schemas/booking-schemas";
import {
  openRoomDetailDrawerSchema,
  updateRoomListSchema,
} from "@/features/room/schemas/room-schemas";
import { useRoomStore } from "@/features/room/stores/room-store";
import type { Room } from "@/features/room/types/room";

export const RoomToolsProvider = () => {
  const setSelectedRoom = useBooking((state) => state.setSelectedRoom);
  const updateBookingForm = useBooking((state) => state.updateBookingForm);

  useFrontendTool(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.ACTION.UPDATE_ROOM_LIST,
      description:
        "Update the room grid on the page. Pass the rooms array returned from getRooms or getAvailableRooms.",
      parameters: updateRoomListSchema,
      handler: async ({ rooms, title }) => {
        useRoomStore.getState().updateRoomList(rooms, title);
        return `Updated room grid with ${rooms.length} room(s).`;
      },
    },
    [],
  );

  useFrontendTool(
    {
      agentId: AGENT_KEYS.HOMESTAY_ASSISTANT,
      name: TOOL_KEYS.ACTION.OPEN_ROOM_DETAIL_DRAWER,
      description:
        "Open the room detail drawer. Pass the room object returned from getRoomById.",
      parameters: openRoomDetailDrawerSchema,
      handler: async ({ room }) => {
        useRoomStore.getState().openRoomDetailDrawer(room);
        return `Opened room detail drawer for ${room.name}.`;
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

  return null;
};

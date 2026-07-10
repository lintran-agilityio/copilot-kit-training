"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  useComponent,
  useFrontendTool,
  useHumanInTheLoop,
} from "@copilotkit/react-core/v2";

import { AGENT_KEYS, TOOL_KEYS } from "@repo/constants";
import { useBooking } from "@/features/booking/hooks";
import { PickRoomForDetailModal } from "@/features/ai-elements/components";
import {
  openRoomDetailDrawerSchema,
  pickRoomForDetailSchema,
  setRoomListLoadingSchema,
  selectRoomForBookingSchema,
  openConfirmBookingSchema,
  updateRoomListSchema,
} from "@/features/room/schemas";
import type { Room } from "@/features/room/types/room";
import { useRoomStore } from "@/features/room/stores/room-store";

import {
  formatRoomListSyncResult,
  syncRoomListToStore,
  formatOpenRoomDetailResult,
  openRoomDetailDrawerUi,
} from "@/features/room/utils";
import { navigateToHomeIfNeeded } from "@/utils";
import { ListRoomPreview } from "@/features/ai-elements/components";

const ROOM_RESULTS_PREVIEW_LIMIT = 5;

export const RoomToolsProvider = () => {
  const router = useRouter();
  const pathname = usePathname();
  const setSelectedRoom = useBooking((state) => state.setSelectedRoom);
  const updateBookingForm = useBooking((state) => state.updateBookingForm);
  const setRoomListLoading = useRoomStore(
    (state) => state.setRoomListLoading,
  );

  useComponent(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.ACTION.RENDER_ROOM_RESULTS_PREVIEW,
      description:
        "Render 2-5 compact room cards in chat after showing or filtering rooms. Use this only as a visual demo; call update_room_list with the full list for the main page grid.",
      parameters: updateRoomListSchema,
      render: ({ rooms, title }) => (
        <ListRoomPreview
          rooms={rooms?.slice(0, ROOM_RESULTS_PREVIEW_LIMIT)}
          title={title}
        />
      ),
    },
    [],
  );

  useFrontendTool(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.ACTION.SET_ROOM_LIST_LOADING,
      description:
        "Show or hide the room grid loading skeleton while room list data is being fetched.",
      parameters: setRoomListLoadingSchema,
      handler: async ({ isLoading }) => {
        setRoomListLoading(isLoading);
        return isLoading
          ? "Room list loading indicator is visible."
          : "Room list loading indicator is hidden.";
      },
    },
    [setRoomListLoading],
  );

  useFrontendTool(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.ACTION.UPDATE_ROOM_LIST,
      description:
        "Update the room grid on the home page. Pass rooms from getRooms or getAvailableRooms as-is. After this succeeds, always send one short guest-facing chat reply summarizing that rooms are ready.",
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
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.ACTION.NAVIGATE_TO_HOME_PAGE,
      description:
        "Navigate to the home page so the room grid is visible. Call ONLY when the guest is on the bookings page (page context isBookingsPage=true). Skip when already on the home page — update_room_list is enough.",
      handler: async () => {
        const navigated = navigateToHomeIfNeeded(pathname, router);
        return navigated
          ? "Navigated to home page."
          : "Already on home page; no navigation needed.";
      },
    },
    [pathname, router],
  );

  useFrontendTool(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
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
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
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
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.ACTION.OPEN_CONFIRM_BOOKING,
      description:
        "After checkRoomAvailability succeeds (available true and guestsWithinCapacity true), open the confirm booking drawer with the staged draft so the guest can press Confirm booking. Pass result.room from checkRoomAvailability plus check-in, check-out, and guests from that same check. Do not call getRoomById or open_room_detail_drawer in a book turn. Do not call createBooking in the same turn — stop and wait for [booking-confirm].",
      parameters: openConfirmBookingSchema,
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

        return `Opened confirm booking for ${room.name}. Waiting for the guest to confirm in the drawer.`;
      },
      followUp: false,
    },
    [updateBookingForm],
  );

  useHumanInTheLoop(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.ACTION.PICK_ROOM_FOR_DETAIL,
      description:
        "Show a room picker when getRoomByName returns multiple rooms. Pass rooms and queryName from getRoomByName. Returns the user's chosen room — then for detail intent open_room_detail_drawer (navigate_to_home_page only if on bookings page); for book intent use the chosen room id with checkRoomAvailability (include latest guests) → open_confirm_booking only if available (do not open_room_detail_drawer).",
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

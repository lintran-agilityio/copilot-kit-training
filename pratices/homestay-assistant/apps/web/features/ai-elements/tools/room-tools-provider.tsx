"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import {
  useComponent,
  useFrontendTool,
} from "@copilotkit/react-core/v2";

import { AGENT_KEYS, TOOL_KEYS } from "@repo/constants";
import { useBooking } from "@/features/booking/hooks";
import {
  setRoomListLoadingSchema,
  selectRoomForBookingSchema,
  showRoomDetailSchema,
  updateRoomListSchema,
} from "@/features/room/schemas";
import { getRoomById } from "@/features/room/services/get-room-by-id";
import { useRoomStore } from "@/features/room/stores/room-store";

import {
  formatRoomListSyncResult,
  syncRoomListToStore,
} from "@/features/room/utils";
import { navigateToHomeIfNeeded } from "@/utils";
import { ListRoomPreview } from "@/features/ai-elements/components";
import { RoomDetail } from "@/features/room/components";
import { parseShowRoomDetailResult } from "../utils";
import { Loading } from "@repo/components";

const ROOM_RESULTS_PREVIEW_LIMIT = 5;

export const RoomToolsProvider = () => {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const setSelectedRoom = useBooking((state) => state.setSelectedRoom);
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
      name: TOOL_KEYS.ACTION.SHOW_ROOM_DETAIL,
      description:
        "Render full RoomDetail in chat for a detail/browse intent. When the message contains roomId:, call with { roomId } only — do NOT call getRoomById first and do NOT describe room fields in chat. After getRoomById in a name lookup, call with { room: result.room }. Always finish with one short guest-facing chat handoff sentence.",
      parameters: showRoomDetailSchema,
      handler: async ({ room, roomId }) => {
        if (room) {
          return JSON.stringify({ room });
        }

        if (!roomId) {
          throw new Error("show_room_detail requires room or roomId");
        }

        const fetchedRoom = await getRoomById({
          roomId,
          userId: user?.id,
        });

        return JSON.stringify({ room: fetchedRoom });
      },
      render: ({ args, status, result }) => {
        const room = args.room ?? parseShowRoomDetailResult(result);

        if (!room) {
          if (status === "inProgress" || status === "executing") {
            return (
              <div className="max-w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-zinc-400">
                <Loading />
              </div>
            );
          }

          return null;
        }

        return (
          <RoomDetail
            {...room}
            className="max-w-full border-white/10 bg-white/[0.02] shadow-none"
          />
        );
      },
    },
    [user?.id],
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

  return null;
};

"use client";

import {
  useComponent,
  useFrontendTool,
  useRenderTool,
} from "@copilotkit/react-core/v2";

import { AGENT_KEYS, TOOL_KEYS } from "@repo/constants";
import { useBooking } from "@/features/booking/hooks";
import {
  getRoomByIdInputSchema,
  selectRoomForBookingSchema,
  updateRoomListSchema,
} from "@/features/room/schemas";

import {
  formatRoomListSyncResult,
  syncRoomListToStore,
} from "@/features/room/utils";
import { ListRoomPreview, GetRoomByIdToolRenderer } from "@/features/ai-elements/components";
import type { GetRoomByIdResult } from "@/features/ai-elements/type";

const ROOM_RESULTS_PREVIEW_LIMIT = 5;

export const RoomToolsProvider = () => {
  const setSelectedRoom = useBooking((state) => state.setSelectedRoom);

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

  useRenderTool(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.BOOKING.GET_ROOM_BY_ID,
      parameters: getRoomByIdInputSchema,
      render: ({ status, result }) => (
        <GetRoomByIdToolRenderer
          status={status}
          result={result as GetRoomByIdResult | string | null}
        />
      ),
    },
    [],
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

"use client";

import { useFrontendTool, useRenderTool } from "@copilotkit/react-core/v2";

import { AGENT_KEYS, TOOL_KEYS } from "@repo/constants";
import {
  findRoomInputSchema,
  getRoomByIdInputSchema,
  updateRoomListSchema,
} from "@/features/room/schemas";
import {
  formatRoomListSyncResult,
  markAgentRoomSearch,
  resolveRoomsByIds,
} from "@/features/room/utils";
import {
  FindRoomNotice,
  GetRoomByIdNotice,
} from "@/features/room/components";
import type {
  FindRoomResult,
  GetRoomByIdResult,
} from "@/features/room/types";

export const RoomToolsProvider = () => {
  useRenderTool(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.BOOKING.GET_ROOM_BY_ID,
      parameters: getRoomByIdInputSchema,
      render: ({ status, result, toolCallId }) => (
        <GetRoomByIdNotice
          status={status}
          result={result as GetRoomByIdResult | string | null}
          toolCallId={toolCallId}
        />
      ),
    },
    [],
  );

  useRenderTool(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: TOOL_KEYS.GET.FIND_ROOM,
      parameters: findRoomInputSchema,
      render: ({ status, result }) => (
        <FindRoomNotice
          status={status}
          result={result as FindRoomResult | string | null}
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
        "Acknowledge the rooms you just found so the chat can present them. Pass room IDs only — get_rooms result.roomIds or find_room result.rooms[].id; the UI resolves the room details and shows the cards in chat. This never changes the page the guest is browsing. After this succeeds, always send one short guest-facing chat reply summarizing that rooms are ready.",
      parameters: updateRoomListSchema,
      handler: async ({ roomIds, title }) => {
        const rooms = await resolveRoomsByIds(roomIds);

        if (!rooms.length) {
          return "Could not resolve those room IDs — nothing to show.";
        }

        markAgentRoomSearch();
        return formatRoomListSyncResult(rooms, title);
      },
    },
    [],
  );

  return null;
};

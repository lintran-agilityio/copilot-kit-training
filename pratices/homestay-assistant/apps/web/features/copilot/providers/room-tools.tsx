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
  resolveRoomsByIds,
  syncRoomListToStore,
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
        "Update the room grid when HomestayAgentContext screen.name is home. Pass room IDs only — get_rooms result.roomIds or find_room result.rooms[].id; the UI resolves the room details. After this succeeds, always send one short guest-facing chat reply summarizing that rooms are ready.",
      parameters: updateRoomListSchema,
      handler: async ({ roomIds, title }) => {
        const rooms = await resolveRoomsByIds(roomIds);

        if (!rooms.length) {
          return "Could not resolve those room IDs — the room grid was left unchanged.";
        }

        syncRoomListToStore(rooms, title);
        return formatRoomListSyncResult(rooms, title);
      },
    },
    [],
  );

  return null;
};

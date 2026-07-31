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
      render: ({ status, result }) => (
        <GetRoomByIdNotice
          status={status}
          result={result as GetRoomByIdResult | string | null}
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
        "Update the room grid when HomestayAgentContext screen.name is home. Pass rooms from get_rooms or find_room as-is. After this succeeds, always send one short guest-facing chat reply summarizing that rooms are ready.",
      parameters: updateRoomListSchema,
      handler: async ({ rooms, title }) => {
        syncRoomListToStore(rooms, title);
        return formatRoomListSyncResult(rooms, title);
      },
    },
    [],
  );

  return null;
};

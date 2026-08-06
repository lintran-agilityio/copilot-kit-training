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
        "Use ONLY after get_rooms (plain catalog browse). Pass roomIds from get_rooms result.roomIds (IDs only). Do NOT call after find_room — ListRoomPreview already renders search results and calling this can duplicate the room list in chat. This tool does not change the page the guest is browsing. After this succeeds, always send one short guest-facing chat reply.",
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

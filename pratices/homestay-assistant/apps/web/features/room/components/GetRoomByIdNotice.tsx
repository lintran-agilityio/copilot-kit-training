"use client";

import { useMemo } from "react";
import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { EmbeddedWidget } from "@/features/chat/components";
import { useArtifactStore } from "@/features/chat/stores/artifact-store";
import { RoomDetail } from "@/features/room/components";
import { ROOM_DETAIL_VARIANT } from "@/features/room/constants/room-detail";
import type {
  GetRoomByIdResult,
  GetRoomByIdToolProps,
} from "@/features/room/types";
import { Loading } from "@repo/components";
import { parseToolResult } from "@repo/utils";

export const GetRoomByIdNotice = ({
  status,
  result,
  toolCallId,
}: GetRoomByIdToolProps) => {
  if (
    status === ToolCallStatus.Executing ||
    status === ToolCallStatus.InProgress
  ) {
    return (
      <EmbeddedWidget className="px-4 py-6 text-zinc-400">
        <Loading />
      </EmbeddedWidget>
    );
  }

  if (status !== ToolCallStatus.Complete) {
    return null;
  }

  const parsed = parseToolResult<GetRoomByIdResult>(result);
  const room = parsed?.room;

  if (!room) {
    return null;
  }

  return (
    <GetRoomByIdBookingForm room={room} toolCallId={toolCallId} />
  );
};

const GetRoomByIdBookingForm = ({
  room,
  toolCallId,
}: {
  room: NonNullable<GetRoomByIdResult["room"]>;
  toolCallId?: string;
}) => {
  const bindToolCall = useArtifactStore((state) => state.bindToolCall);

  const artifactId = useMemo(() => {
    if (!toolCallId) {
      return useArtifactStore.getState().registerBookingForm(room.id);
    }
    return bindToolCall(toolCallId, room.id);
  }, [bindToolCall, room.id, toolCallId]);

  return (
    <EmbeddedWidget unframed>
      <RoomDetail
        {...room}
        artifactId={artifactId}
        variant={ROOM_DETAIL_VARIANT.CHAT_BOOKING}
        className="w-full border-white/12 bg-[#111111] shadow-none"
      />
    </EmbeddedWidget>
  );
};

"use client";

import { useEffect, useState } from "react";
import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { EmbeddedWidget } from "@/features/chat/components";
import { useGenericUiInteraction } from "@/features/chat/hooks";
import { useArtifactStore } from "@/features/chat/stores/artifact-store";
import {
  ARTIFACT_STATUS,
  isArtifactInteractive,
} from "@/features/chat/types/artifact";
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

  return <GetRoomByIdBookingForm room={room} toolCallId={toolCallId} />;
};

const GetRoomByIdBookingForm = ({
  room,
  toolCallId,
}: {
  room: NonNullable<GetRoomByIdResult["room"]>;
  toolCallId?: string;
}) => {
  const boundArtifactId = useArtifactStore((state) =>
    toolCallId ? state.toolCallBindings[toolCallId] : undefined,
  );
  const [fallbackArtifactId, setFallbackArtifactId] = useState<string | null>(
    null,
  );
  const { isActionable } = useGenericUiInteraction(toolCallId);
  const setArtifactStatus = useArtifactStore((state) => state.setStatus);
  const artifactStatus = useArtifactStore((state) => {
    const id = boundArtifactId ?? fallbackArtifactId;
    return id ? state.artifacts[id]?.status : undefined;
  });

  useEffect(() => {
    if (toolCallId) {
      if (useArtifactStore.getState().toolCallBindings[toolCallId]) {
        return;
      }
      useArtifactStore.getState().bindToolCall(toolCallId, room.id);
      return;
    }

    if (fallbackArtifactId) {
      return;
    }

    setFallbackArtifactId(
      useArtifactStore.getState().registerBookingForm(room.id),
    );
  }, [fallbackArtifactId, room.id, toolCallId]);

  const artifactId = boundArtifactId ?? fallbackArtifactId ?? undefined;

  // New user request → lock prior booking-form actions (informational stay).
  useEffect(() => {
    if (!artifactId || isActionable) {
      return;
    }

    if (isArtifactInteractive(artifactStatus)) {
      setArtifactStatus(artifactId, ARTIFACT_STATUS.EXPIRED);
    }
  }, [artifactId, artifactStatus, isActionable, setArtifactStatus]);

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

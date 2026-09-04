"use client";

import { useEffect, useState } from "react";
import { ToolCallStatus, useAgent } from "@copilotkit/react-core/v2";

import { AGENT_KEYS } from "@repo/constants";
import { EmbeddedWidget } from "@/features/chatbot/components";
import { useGenericUiInteraction } from "@/features/chatbot/hooks";
import { useArtifactStore } from "@/features/chatbot/stores/artifact-store";
import {
  ARTIFACT_STATUS,
  isArtifactInteractive,
} from "@/features/chatbot/types/artifact";
import type { MessageLike } from "@/features/chatbot/types";
import { hasLaterToolCallInTurn } from "@/features/chatbot/utils";
import { RoomDetail } from "@/features/room/components";
import { ROOM_DETAIL_VARIANT } from "@/constants";
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
  const { agent } = useAgent({ agentId: AGENT_KEYS.HOMESTAY_ASSISTANT });

  // The BOOK workflow moved on to a later tool call in this same turn (e.g.
  // check_room_availability / confirm_booking) — deterministic routing on the
  // agent side already forces exactly one of Booking Form / Confirm dialog,
  // but stay defensive against replay/duplicate tool emissions (see
  // find-room-turn.ts) rather than ever rendering both at once.
  if (
    hasLaterToolCallInTurn(
      agent.messages as MessageLike[] | undefined,
      toolCallId,
    )
  ) {
    return null;
  }

  if (
    status === ToolCallStatus.Executing ||
    status === ToolCallStatus.InProgress
  ) {
    return (
      <EmbeddedWidget className="px-4 py-6 text-muted-foreground">
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
        className="w-full border-border bg-card shadow-none"
      />
    </EmbeddedWidget>
  );
};

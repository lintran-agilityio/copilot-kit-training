"use client";

import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { ChatGenerativeUILayout } from "@/features/chat/components";
import { RoomDetail } from "@/features/room/components";
import type {
  GetRoomByIdResult,
  GetRoomByIdToolProps,
} from "@/features/room/types";
import { Loading } from "@repo/components";
import { cn, parseToolResult } from "@repo/utils";

export const GetRoomByIdNotice = ({
  status,
  result,
}: GetRoomByIdToolProps) => {
  if (
    status === ToolCallStatus.Executing ||
    status === ToolCallStatus.InProgress
  ) {
    return (
      <ChatGenerativeUILayout
        className={cn(
          "rounded-xl border border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-zinc-400",
        )}
      >
        <Loading />
      </ChatGenerativeUILayout>
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
    <ChatGenerativeUILayout>
      <RoomDetail
        {...room}
        variant="chat-booking"
        className="w-full border-white/10 bg-white/[0.02] shadow-none"
      />
    </ChatGenerativeUILayout>
  );
};

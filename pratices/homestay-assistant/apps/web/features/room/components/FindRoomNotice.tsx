"use client";

import { useEffect, useRef } from "react";
import { ToolCallStatus } from "@copilotkit/react-core/v2";

import { parseToolResult } from "@repo/utils";
import { RoomListSkeleton } from "@/components/common/RoomListSkeleton";
import { EmbeddedWidget } from "@/features/chat/components";
import { ListRoomPreview } from "@/features/room/components/ListRoomPreview";
import type {
  FindRoomResult,
  FindRoomToolProps,
} from "@/features/room/types";
import {
  buildFindRoomTitle,
  markAgentRoomSearch,
} from "@/features/room/utils";

type ToolErrorResult = {
  error: true;
  message?: string;
};

const getFindRoomToolError = (
  result: FindRoomToolProps["result"],
): string | null => {
  if (typeof result === "string" && result.trim()) {
    // Mastra may return a plain error string; avoid treating JSON payloads as errors.
    if (result.trimStart().startsWith("{")) {
      try {
        const parsed = JSON.parse(result) as ToolErrorResult | FindRoomResult;
        if (
          parsed &&
          typeof parsed === "object" &&
          "error" in parsed &&
          parsed.error === true
        ) {
          return parsed.message?.trim() || "Room search failed.";
        }
        return null;
      } catch {
        return result.trim();
      }
    }
    return result.trim();
  }

  if (
    result &&
    typeof result === "object" &&
    "error" in result &&
    (result as ToolErrorResult).error === true
  ) {
    return (
      (result as ToolErrorResult).message?.trim() || "Room search failed."
    );
  }

  return null;
};

/**
 * True when BOOK name-resolve should skip Room List (exactly one match).
 * FIND/RECOMMEND always show the list when matches exist.
 */
const shouldSuppressRoomList = (
  purpose: FindRoomResult["purpose"] | undefined,
  roomCount: number,
) => purpose === "book_resolve" && roomCount === 1;

/**
 * Renders find_room tool output in chat: skeleton while loading, room cards when done.
 * Results stay inside chat — the page room grid is never mutated from here.
 *
 * Book resolve + exactly one match → no Room List (text / availability / Confirm only).
 *
 * @param props - CopilotKit tool render status, result, and optional streaming args
 */
export const FindRoomNotice = ({
  status,
  result,
  parameters,
}: FindRoomToolProps) => {
  const lastMarkedKeyRef = useRef<string | null>(null);

  const toolError =
    status === ToolCallStatus.Complete ? getFindRoomToolError(result) : null;
  const parsed =
    status === ToolCallStatus.Complete && !toolError
      ? parseToolResult<FindRoomResult>(result)
      : null;
  const rooms = parsed?.rooms ?? [];
  const purpose = parsed?.purpose ?? parameters?.purpose;
  const title = parsed ? buildFindRoomTitle(parsed) : "Room results";
  const roomIdsKey = rooms.map((room) => room.id).join(",");
  const suppressList = shouldSuppressRoomList(purpose, rooms.length);
  // book_resolve loads toward Confirm / ask-fields — avoid Room List skeleton flash.
  const suppressLoadingSkeleton = parameters?.purpose === "book_resolve";

  useEffect(() => {
    if (status !== ToolCallStatus.Complete || !rooms.length || suppressList) {
      return;
    }

    const searchKey = `${title}:${roomIdsKey}`;
    if (lastMarkedKeyRef.current === searchKey) {
      return;
    }

    lastMarkedKeyRef.current = searchKey;
    markAgentRoomSearch();
  }, [status, rooms, title, roomIdsKey, suppressList]);

  if (
    status === ToolCallStatus.Executing ||
    status === ToolCallStatus.InProgress
  ) {
    if (suppressLoadingSkeleton) {
      return null;
    }

    return (
      <EmbeddedWidget className="p-3.5">
        <RoomListSkeleton itemCount={3} className="max-w-full" />
      </EmbeddedWidget>
    );
  }

  if (status !== ToolCallStatus.Complete) {
    return null;
  }

  if (toolError) {
    return (
      <EmbeddedWidget className="px-3.5 py-3 text-zinc-400">
        Could not search rooms. {toolError}
      </EmbeddedWidget>
    );
  }

  if (!rooms.length) {
    return (
      <EmbeddedWidget className="px-3.5 py-3 text-zinc-400">
        No rooms matched that search.
      </EmbeddedWidget>
    );
  }

  if (suppressList) {
    return null;
  }

  return (
    <EmbeddedWidget unframed>
      <ListRoomPreview rooms={rooms} title={title} />
    </EmbeddedWidget>
  );
};

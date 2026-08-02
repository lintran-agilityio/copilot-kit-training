"use client";

import { useCallback } from "react";

import { useRoomStore } from "@/features/room/stores/room-store";

type OpenRoomOnPageArgs = {
  roomId: string;
};

export const useOpenRoomOnPage = () => {
  const setSelectedRoomId = useRoomStore((state) => state.setSelectedRoomId);

  return useCallback(
    ({ roomId }: OpenRoomOnPageArgs) => {
      if (!roomId) {
        return;
      }

      setSelectedRoomId(roomId);
    },
    [setSelectedRoomId],
  );
};

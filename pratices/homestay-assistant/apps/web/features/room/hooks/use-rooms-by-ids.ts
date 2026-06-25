"use client";

import { useEffect, useState } from "react";

import { fetchRoomsByIds } from "../services";
import type { Room } from "../types/room";

export const useRoomsByIds = (roomIds: string[]) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(roomIds.length > 0);
  const roomIdsKey = roomIds.join(",");

  useEffect(() => {
    if (!roomIds.length) {
      setRooms([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadRooms = async () => {
      setIsLoading(true);

      try {
        setRooms(await fetchRoomsByIds(roomIds, controller.signal));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Failed to resolve rooms by id", error);
        setRooms([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadRooms();

    return () => controller.abort();
  }, [roomIdsKey, roomIds, roomIds.length]);

  return { rooms, isLoading };
};

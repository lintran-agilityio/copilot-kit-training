import { PREFIX_URL } from "@repo/types";

import { getRooms } from "@/features/room/services";
import { useRoomStore } from "@/features/room/stores/room-store";
import type { Room } from "@/features/room/types/room";

export const syncRoomListToStore = (rooms: Room[], title?: string) => {
  const store = useRoomStore.getState();
  store.updateRoomList(rooms, title);
  store.markAgentRoomSearch();
};

/**
 * Resolves room IDs against rooms already in the store, falling back to one
 * fetch when the store is empty or an id is unknown (e.g. chat opened on a
 * page that never seeded the grid).
 */
export const resolveRoomsByIds = async (roomIds: string[]): Promise<Room[]> => {
  const roomsById = new Map(
    useRoomStore.getState().rooms.map((room) => [room.id, room]),
  );

  if (roomIds.some((id) => !roomsById.has(id))) {
    const fetched = await getRooms({ via: PREFIX_URL.WEB });
    fetched.forEach((room) => roomsById.set(room.id, room));
  }

  return roomIds
    .map((id) => roomsById.get(id))
    .filter((room): room is Room => Boolean(room));
};

export const formatRoomListSyncResult = (rooms: Room[], title?: string) =>
  title
    ? `Updated room grid with ${rooms.length} room(s) (${title}).`
    : `Updated room grid with ${rooms.length} room(s).`;

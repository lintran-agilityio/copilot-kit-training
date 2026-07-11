import { useRoomStore } from "@/features/room/stores/room-store";
import type { Room } from "@/features/room/types/room";

export const syncRoomListToStore = (rooms: Room[], title?: string) => {
  useRoomStore.getState().updateRoomList(rooms, title);
};

export const formatRoomListSyncResult = (rooms: Room[], title?: string) =>
  title
    ? `Updated room grid with ${rooms.length} room(s) (${title}).`
    : `Updated room grid with ${rooms.length} room(s).`;

export const openRoomDetailModalUi = (room: Room) => {
  useRoomStore.getState().openRoomDetailModal(room);
};

export const formatOpenRoomDetailResult = (room: Room) =>
  `Opened room detail modal for ${room.name}.`;

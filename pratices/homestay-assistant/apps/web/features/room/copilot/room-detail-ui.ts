import { useRoomStore } from "@/features/room/stores/room-store";
import type { Room } from "@/features/room/types/room";

export const openRoomDetailDrawerUi = (room: Room) => {
  useRoomStore.getState().openRoomDetailDrawer(room);
};

export const formatOpenRoomDetailResult = (room: Room) =>
  `Opened room detail drawer for ${room.name}.`;

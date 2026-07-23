import { create } from "zustand";

import type { Room } from "@/features/room/types/room";

type RoomStore = {
  rooms: Room[];
  roomListTitle: string | undefined;
  isRoomListLoading: boolean;
  updateRoomList: (rooms: Room[], title?: string) => void;
};

export const useRoomStore = create<RoomStore>()((set) => ({
  rooms: [],
  roomListTitle: undefined,
  isRoomListLoading: false,

  updateRoomList: (rooms, title) =>
    set({ rooms, roomListTitle: title, isRoomListLoading: false }),

}));

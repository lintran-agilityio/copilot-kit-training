import { create } from "zustand";

import type { Room } from "@/features/room/types/room";

type RoomStore = {
  rooms: Room[];
  roomListTitle: string | undefined;
  isRoomListLoading: boolean;
  selectedRoomId: string | null;
  updateRoomList: (rooms: Room[], title?: string) => void;
  setSelectedRoomId: (roomId: string | null) => void;
  clearSelectedRoom: () => void;
};

export const useRoomStore = create<RoomStore>()((set) => ({
  rooms: [],
  roomListTitle: undefined,
  isRoomListLoading: false,
  selectedRoomId: null,

  updateRoomList: (rooms, title) =>
    set({ rooms, roomListTitle: title, isRoomListLoading: false }),

  setSelectedRoomId: (roomId) => set({ selectedRoomId: roomId }),

  clearSelectedRoom: () => set({ selectedRoomId: null }),
}));

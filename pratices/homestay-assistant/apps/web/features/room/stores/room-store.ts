import { create } from "zustand";

import type { Room } from "@/features/room/types/room";

type RoomStore = {
  rooms: Room[];
  roomListTitle: string | undefined;
  isRoomListLoading: boolean;
  selectedRoom: Room | null;
  isDrawerOpen: boolean;
  updateRoomList: (rooms: Room[], title?: string) => void;
  setRoomListLoading: (isLoading: boolean) => void;
  openRoomDetailDrawer: (room: Room) => void;
  closeRoomDetailDrawer: () => void;
};

export const useRoomStore = create<RoomStore>()((set) => ({
  rooms: [],
  roomListTitle: undefined,
  isRoomListLoading: false,
  selectedRoom: null,
  isDrawerOpen: false,

  updateRoomList: (rooms, title) =>
    set({ rooms, roomListTitle: title, isRoomListLoading: false }),

  setRoomListLoading: (isLoading) => set({ isRoomListLoading: isLoading }),

  openRoomDetailDrawer: (room) =>
    set({ selectedRoom: room, isDrawerOpen: true }),

  closeRoomDetailDrawer: () =>
    set({ isDrawerOpen: false, selectedRoom: null }),
}));

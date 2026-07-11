import { create } from "zustand";

import type { Room } from "@/features/room/types/room";

type RoomStore = {
  rooms: Room[];
  roomListTitle: string | undefined;
  isRoomListLoading: boolean;
  selectedRoom: Room | null;
  isModalOpen: boolean;
  updateRoomList: (rooms: Room[], title?: string) => void;
  setRoomListLoading: (isLoading: boolean) => void;
  openRoomDetailModal: (room: Room) => void;
  closeRoomDetailModal: () => void;
};

export const useRoomStore = create<RoomStore>()((set) => ({
  rooms: [],
  roomListTitle: undefined,
  isRoomListLoading: false,
  selectedRoom: null,
  isModalOpen: false,

  updateRoomList: (rooms, title) =>
    set({ rooms, roomListTitle: title, isRoomListLoading: false }),

  setRoomListLoading: (isLoading) => set({ isRoomListLoading: isLoading }),

  openRoomDetailModal: (room) =>
    set({ selectedRoom: room, isModalOpen: true }),

  closeRoomDetailModal: () =>
    set({ isModalOpen: false, selectedRoom: null }),
}));

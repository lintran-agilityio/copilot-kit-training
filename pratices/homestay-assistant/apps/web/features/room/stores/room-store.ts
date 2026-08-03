import { create } from "zustand";

import type { Room } from "@/features/room/types/room";

type RoomStore = {
  rooms: Room[];
  roomListTitle: string | undefined;
  isRoomListLoading: boolean;
  selectedRoomId: string | null;
  /** True after the agent syncs the room grid (find/browse), not the initial page seed. */
  hasAgentRoomSearch: boolean;
  updateRoomList: (rooms: Room[], title?: string) => void;
  markAgentRoomSearch: () => void;
  setSelectedRoomId: (roomId: string | null) => void;
  clearSelectedRoom: () => void;
  clearAgentRoomSearch: () => void;
};

export const useRoomStore = create<RoomStore>()((set) => ({
  rooms: [],
  roomListTitle: undefined,
  isRoomListLoading: false,
  selectedRoomId: null,
  hasAgentRoomSearch: false,

  updateRoomList: (rooms, title) =>
    set({ rooms, roomListTitle: title, isRoomListLoading: false }),

  markAgentRoomSearch: () => set({ hasAgentRoomSearch: true }),

  setSelectedRoomId: (roomId) => set({ selectedRoomId: roomId }),

  clearSelectedRoom: () => set({ selectedRoomId: null }),

  clearAgentRoomSearch: () => set({ hasAgentRoomSearch: false }),
}));

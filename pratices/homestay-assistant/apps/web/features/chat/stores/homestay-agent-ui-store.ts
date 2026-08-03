import { create } from "zustand";

import type {
  HomestayAgentFocusType,
  HomestayAgentTaskStatus,
  HomestayAgentTaskType,
} from "@/features/chat/types";

export type HomestayAgentWorkflowEntry = {
  key: string;
  task: {
    type: HomestayAgentTaskType;
    status: HomestayAgentTaskStatus;
  };
  focus?: {
    type: HomestayAgentFocusType;
    id: string;
  };
};

type HomestayAgentUiStore = {
  /** LIFO stack of room ids from mounted detail UI (supports multiple chat cards). */
  focusedRoomStack: string[];
  workflowEntries: HomestayAgentWorkflowEntry[];
  /** Transient: set after create_booking succeeds; cleared on the next agent run. */
  bookingJustCompleted: boolean;
  pushFocusedRoom: (roomId: string) => void;
  popFocusedRoom: (roomId: string) => void;
  pushWorkflow: (entry: HomestayAgentWorkflowEntry) => void;
  popWorkflow: (key: string) => void;
  setBookingJustCompleted: (value: boolean) => void;
  resetWorkflow: () => void;
  reset: () => void;
};

const initialState = {
  focusedRoomStack: [] as string[],
  workflowEntries: [] as HomestayAgentWorkflowEntry[],
  bookingJustCompleted: false,
};

export const selectFocusedRoomId = (
  stack: string[],
): string | null => stack.at(-1) ?? null;

export const useHomestayAgentUiStore = create<HomestayAgentUiStore>()(
  (set) => ({
    ...initialState,

    pushFocusedRoom: (roomId) =>
      set((state) => ({
        focusedRoomStack: [...state.focusedRoomStack, roomId],
      })),

    popFocusedRoom: (roomId) =>
      set((state) => {
        const stack = [...state.focusedRoomStack];
        const index = stack.lastIndexOf(roomId);
        if (index === -1) {
          return state;
        }
        stack.splice(index, 1);
        return { focusedRoomStack: stack };
      }),

    pushWorkflow: (entry) =>
      set((state) => ({
        workflowEntries: [
          ...state.workflowEntries.filter((item) => item.key !== entry.key),
          entry,
        ],
      })),

    popWorkflow: (key) =>
      set((state) => ({
        workflowEntries: state.workflowEntries.filter((item) => item.key !== key),
      })),

    setBookingJustCompleted: (value) => set({ bookingJustCompleted: value }),

    resetWorkflow: () => set({ workflowEntries: [] }),

    reset: () => set(initialState),
  }),
);

export const selectActiveHomestayWorkflow = (
  entries: HomestayAgentWorkflowEntry[],
): HomestayAgentWorkflowEntry | null => entries.at(-1) ?? null;

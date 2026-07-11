"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RoomDetail } from "@/features/room/components/RoomDetail";
import { useRoomStore } from "@/features/room/stores/room-store";

export const RoomDetailModal = () => {
  const selectedRoom = useRoomStore((state) => state.selectedRoom);
  const isModalOpen = useRoomStore((state) => state.isModalOpen);
  const closeRoomDetailModal = useRoomStore(
    (state) => state.closeRoomDetailModal,
  );

  return (
    <Dialog
      open={isModalOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeRoomDetailModal();
        }
      }}
    >
      <DialogContent
        className="flex max-h-[min(90vh,900px)] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden border-white/10 bg-[#0a0a0a] p-0 text-zinc-100 sm:max-w-[700px]"
        showCloseButton
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{selectedRoom?.name ?? "Room detail"}</DialogTitle>
          <DialogDescription>
            {selectedRoom?.description ?? "Room information"}
          </DialogDescription>
        </DialogHeader>

        <div className="app-scrollbar min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4">
          {selectedRoom ? <RoomDetail {...selectedRoom} /> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

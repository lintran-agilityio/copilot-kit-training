"use client";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { RoomDetail } from "@/features/room/components/RoomDetail";
import { useRoomStore } from "@/features/room/stores/room-store";

export const RoomDetailDrawer = () => {
  const selectedRoom = useRoomStore((state) => state.selectedRoom);
  const isDrawerOpen = useRoomStore((state) => state.isDrawerOpen);
  const closeRoomDetailDrawer = useRoomStore(
    (state) => state.closeRoomDetailDrawer,
  );

  return (
    <Drawer
      open={isDrawerOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeRoomDetailDrawer();
        }
      }}
      direction="left"
    >
      <DrawerContent className="bg-[#0a0a0a] text-zinc-100 data-[vaul-drawer-direction=left]:!h-full data-[vaul-drawer-direction=left]:!w-[700px] data-[vaul-drawer-direction=left]:!max-w-[700px] data-[vaul-drawer-direction=left]:sm:!max-w-[700px]">
        <DrawerHeader className="sr-only">
          <DrawerTitle>{selectedRoom?.name ?? "Room detail"}</DrawerTitle>
          <DrawerDescription>
            {selectedRoom?.description ?? "Room information"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="app-scrollbar min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4">
          {selectedRoom ? <RoomDetail {...selectedRoom} /> : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

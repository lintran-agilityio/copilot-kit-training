"use client";

import { useState } from "react";
import type { ToolCallStatus } from "@copilotkit/react-core/v2";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  PickRoomForDetailArgs,
  PickRoomForDetailResult,
} from "../schemas";

type PickRoomForDetailModalProps = {
  status: ToolCallStatus;
  args: Partial<PickRoomForDetailArgs>;
  respond?: (result: PickRoomForDetailResult) => Promise<void>;
};

type PickRoomItem = PickRoomForDetailArgs["rooms"][number];

export const PickRoomForDetailModal = ({
  status,
  args,
  respond,
}: PickRoomForDetailModalProps) => {
  const [selectedRoom, setSelectedRoom] = useState<PickRoomItem | null>(null);
  const canRespond = status === "executing" && respond != null;
  const open = status === "executing" || status === "inProgress";
  const rooms = args.rooms ?? [];

  const confirmSelection = async (room: PickRoomItem) => {
    await respond?.({ confirmed: true, room });
  };

  if (selectedRoom) {
    return (
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && canRespond) {
            setSelectedRoom(null);
          }
        }}
      >
        <DialogContent className="border-white/10 bg-[#111111] text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              Open {selectedRoom.name}?
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              View room details in the drawer.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 text-sm">
            <p className="font-medium text-zinc-100">{selectedRoom.name}</p>
            <p className="text-zinc-400">
              Level {selectedRoom.level} · up to {selectedRoom.capacity} guests
            </p>
          </div>

          <DialogFooter className="border-white/8 bg-transparent">
            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-transparent text-zinc-200 hover:bg-white/5 hover:text-white"
              disabled={!canRespond}
              onClick={() => setSelectedRoom(null)}
            >
              Back
            </Button>
            <Button
              type="button"
              className="bg-white text-black hover:bg-zinc-200"
              disabled={!canRespond}
              onClick={() => void confirmSelection(selectedRoom)}
            >
              View room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (rooms.length > 1) {
    return (
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && canRespond) {
            void respond?.({ confirmed: false, reason: "declined" });
          }
        }}
      >
        <DialogContent className="border-white/10 bg-[#111111] text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              Which room did you mean?
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Multiple rooms match &ldquo;{args.queryName}&rdquo;. Select one to
              view details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                disabled={!canRespond}
                className="flex w-full flex-col rounded-xl border border-white/8 bg-white/[0.02] p-4 text-left text-sm transition hover:bg-white/[0.05] disabled:opacity-50"
                onClick={() => setSelectedRoom(room)}
              >
                <span className="font-medium text-zinc-100">{room.name}</span>
                <span className="text-zinc-400">
                  Level {room.level} · up to {room.capacity} guests
                </span>
              </button>
            ))}
          </div>

          <DialogFooter className="border-white/8 bg-transparent">
            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-transparent text-zinc-200 hover:bg-white/5 hover:text-white"
              disabled={!canRespond}
              onClick={() => void respond?.({ confirmed: false, reason: "declined" })}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open}>
      <DialogContent className="border-white/10 bg-[#111111] text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Preparing room picker…</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Waiting for matching rooms from the assistant.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

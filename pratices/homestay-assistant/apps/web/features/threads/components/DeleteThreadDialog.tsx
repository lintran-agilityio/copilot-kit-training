"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DeleteThreadDialogProps = {
  open: boolean;
  threadLabel: string;
  isDeleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export const DeleteThreadDialog = ({
  open,
  threadLabel,
  isDeleting = false,
  onCancel,
  onConfirm,
}: DeleteThreadDialogProps) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isDeleting) {
          onCancel();
        }
      }}
    >
      <DialogContent
        showCloseButton={!isDeleting}
        className="border-white/10 bg-[#111111] text-zinc-100 sm:max-w-md"
      >
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
            <div className="space-y-1.5">
              <DialogTitle className="text-lg font-medium text-white">
                Delete this thread?
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                This will permanently delete{" "}
                <span className="font-medium text-zinc-200">{threadLabel}</span>{" "}
                and all of its messages. This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="border-white/8 bg-transparent">
          <Button
            type="button"
            variant="outline"
            className="border-white/10 bg-transparent text-zinc-200 hover:bg-white/5 hover:text-white"
            disabled={isDeleting}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? "Deleting…" : "Delete thread"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

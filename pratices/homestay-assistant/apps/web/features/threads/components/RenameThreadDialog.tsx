"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type RenameThreadDialogProps = {
  open: boolean;
  initialName: string;
  isSubmitting?: boolean;
  onCancel: () => void;
  onConfirm: (name: string) => void;
};

export const RenameThreadDialog = ({
  open,
  initialName,
  isSubmitting = false,
  onCancel,
  onConfirm,
}: RenameThreadDialogProps) => {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (open) {
      setName(initialName);
    }
  }, [initialName, open]);

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && !isSubmitting;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    onConfirm(trimmedName);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSubmitting) {
          onCancel();
        }
      }}
    >
      <DialogContent
        showCloseButton={!isSubmitting}
        className="border-white/10 bg-[#111111] text-zinc-100 sm:max-w-md"
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-zinc-200">
                <Pencil className="size-5" />
              </div>
              <div className="space-y-1.5">
                <DialogTitle className="text-lg font-medium text-white">
                  Rename thread
                </DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Enter a new name for this conversation.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-2">
            <label htmlFor="thread-rename-input" className="sr-only">
              Thread name
            </label>
            <input
              id="thread-rename-input"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Thread name"
              autoFocus
              disabled={isSubmitting}
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-white/20 focus:ring-2 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <DialogFooter className="border-white/8 bg-transparent">
            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-transparent text-zinc-200 hover:bg-white/5 hover:text-white"
              disabled={isSubmitting}
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

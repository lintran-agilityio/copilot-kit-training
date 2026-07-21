"use client";

import { Plus } from "lucide-react";

type NewThreadButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

export const NewThreadButton = ({
  onClick,
  disabled = false,
}: NewThreadButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-zinc-200 transition hover:border-white/25 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Plus className="size-3.5" aria-hidden />
      New Thread
    </button>
  );
};

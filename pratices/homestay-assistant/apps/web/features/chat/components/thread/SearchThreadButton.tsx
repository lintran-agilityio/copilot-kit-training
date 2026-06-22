"use client";

import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

import { cn } from "@/utils";

type SearchThreadButtonProps = {
  value: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export const SearchThreadButton = ({
  value,
  onChange,
  isOpen,
  onOpenChange,
}: SearchThreadButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleClose = () => {
    onChange("");
    onOpenChange(false);
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-2">
      {!isOpen ? (
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium text-zinc-300"
          onClick={() => onOpenChange(true)}
        >
          <Search className="size-4" aria-hidden />
          Search
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <Search className="size-4 shrink-0 text-zinc-400" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Search conversations..."
            className={cn(
              "min-w-0 flex-1 bg-transparent text-sm text-zinc-300 outline-none",
              "placeholder:text-zinc-500",
            )}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                handleClose();
              }
            }}
          />
          <button
            type="button"
            className="shrink-0 text-zinc-400 hover:text-zinc-300"
            onClick={handleClose}
            aria-label="Close search"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
};

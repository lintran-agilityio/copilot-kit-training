// Libs
import { RotateCcw } from "lucide-react";

// Internal
import { cn } from "@repo/utils";

type HeaderChatProps = {
  title?: string;
  subtitle?: string;
  online?: boolean;
  className?: string;
  onReset?: () => void;
};

/**
 * Chat sidebar header with online status and optional conversation reset.
 *
 * @param props - Title, subtitle, online indicator, and reset handler
 */
export const HeaderChat = ({
  title = "AI Assistant",
  subtitle = "Powered by Spaces AI",
  online = true,
  className,
  onReset,
}: HeaderChatProps) => {
  return (
    <div
      className={cn(
        "flex items-start justify-between border-b border-white/10 px-5 py-4 pr-12",
        className,
      )}
    >
      <div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3 pt-1 pr-4">
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            aria-label="Reset conversation"
            title="Start over"
            className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1 text-[11px] font-medium text-zinc-300 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
          >
            <RotateCcw className="size-3" aria-hidden />
            Reset
          </button>
        ) : null}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-2 rounded-full",
              online ? "bg-emerald-400" : "bg-zinc-500",
            )}
          />
          <span className="text-[11px] text-zinc-500">
            {online ? "online" : "offline"}
          </span>
        </div>
      </div>
    </div>
  );
};

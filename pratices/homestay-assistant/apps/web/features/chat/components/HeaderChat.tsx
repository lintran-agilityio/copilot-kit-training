import { cn } from "@repo/utils";;

type HeaderChatProps = {
  title?: string;
  subtitle?: string;
  online?: boolean;
  className?: string;
};

export const HeaderChat = ({
  title = "AI Assistant",
  subtitle = "Powered by Spaces AI",
  online = true,
  className,
}: HeaderChatProps) => {
  return (
    <div
      className={cn(
        "flex items-start justify-between border-b border-white/10 px-5 py-4",
        className,
      )}
    >
      <div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>
      </div>

      <div className="flex items-center gap-2 pt-1">
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
  );
}

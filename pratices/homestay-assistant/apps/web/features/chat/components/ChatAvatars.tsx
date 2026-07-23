import { Bot, Droplets } from "lucide-react";

import { cn } from "@repo/utils";

type AvatarProps = {
  className?: string;
};

export const ChatAgentAvatar = ({ className }: AvatarProps) => (
  <div
    className={cn(
      "flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E6C547]",
      className,
    )}
    aria-hidden
  >
    <Bot className="size-4 text-[#1a1a1a]" strokeWidth={2.25} />
  </div>
);

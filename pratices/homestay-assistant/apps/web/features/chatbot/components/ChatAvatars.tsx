import { Leaf } from "lucide-react";

import { cn } from "@repo/utils";

type AvatarProps = {
  className?: string;
};

export const ChatAgentAvatar = ({ className }: AvatarProps) => (
  <div
    className={cn(
      "flex size-8 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/15 text-gold",
      className,
    )}
    aria-hidden
  >
    <Leaf className="size-4" strokeWidth={2} />
  </div>
);

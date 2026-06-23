"use client";

// Libs
import { forwardRef } from "react";
import {
  CopilotChatSuggestionPill,
  type CopilotChatSuggestionPillProps
} from "@copilotkit/react-core/v2";

import { cn } from "@repo/utils";;

export const CopilotSuggestion = forwardRef<
HTMLButtonElement,
CopilotChatSuggestionPillProps
>(function StyledSuggestionPill({ className, ...props }, ref) {
return (
  <CopilotChatSuggestionPill
    {...props}
    ref={ref}
    className={cn(
      "rounded-full border border-white/15 bg-transparent px-3 py-1.5 text-xs text-zinc-300 hover:border-[#E6C547]/40 hover:bg-[#E6C547]/10 hover:text-white",
      className,
    )}
  />
);
});

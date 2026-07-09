import { useEffect } from "react";
import { scrollChatToEnd } from "@/features/assistant-ui/utils";

export const useChatScroll = (messageCount: number) => {
  useEffect(() => {
    requestAnimationFrame(() => scrollChatToEnd());
  }, [messageCount]);
};

import { useEffect } from "react";
import { scrollChatToEnd } from "../utils";

export const useChatScroll = (messageCount: number) => {
  useEffect(() => {
    requestAnimationFrame(() => scrollChatToEnd());
  }, [messageCount]);
};

import { useEffect } from "react";
import { scrollChatToEnd } from "../utils";

export const useChatScroll = (deps: unknown[]) => {
  useEffect(() => {
    requestAnimationFrame(() => scrollChatToEnd());
  }, deps);
};

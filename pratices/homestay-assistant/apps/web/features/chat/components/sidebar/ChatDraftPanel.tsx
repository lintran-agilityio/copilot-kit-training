"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";

import { cn } from "@repo/utils";
import { HeaderChat } from "@/features/chat/components/sidebar/HeaderChat";
import { ChatAgentAvatar } from "@/features/chat/components/sidebar/ChatAvatars";
import { CopilotSuggestion } from "@/components/suggestions/CopilotSuggestion";

import { CHAT_SUGGESTIONS, WELCOME_MESSAGE } from "../../constants";
import { useActiveThread } from "../../hooks";
import { useThreadContext } from "../../contexts/thread-context";
import { useChatStore } from "../../stores/chat-store";

import { ChatSidebarProps } from "./ChatSidebar";

export const ChatDraftPanel = ({ className, agentId }: ChatSidebarProps) => {
  const [input, setInput] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const { createThread } = useThreadContext();
  const { scopeKey, setActiveThreadId } = useActiveThread(agentId);
  const setPreferDraftMode = useChatStore((state) => state.setPreferDraftMode);
  const setPendingOutboundMessage = useChatStore(
    (state) => state.setPendingOutboundMessage,
  );

  const startConversation = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || !scopeKey || isStarting) {
      return;
    }

    setIsStarting(true);
    try {
      const thread = await createThread();
      setPreferDraftMode(scopeKey, false);
      setPendingOutboundMessage(scopeKey, trimmed);
      setActiveThreadId(thread.id);
      setInput("");
    } catch (error) {
      console.error("Failed to start a new conversation", error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void startConversation(input);
  };

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col border-l border-white/10 bg-[#0a0a0a]",
        className,
      )}
    >
      <HeaderChat />

      <div
        data-sidebar-chat
        className="flex min-h-0 flex-1 flex-col overflow-hidden pt-4"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-4 pt-6">
            <div className="flex items-start gap-3">
              <ChatAgentAvatar />
              <p className="max-w-[85%] rounded-2xl bg-zinc-800/80 px-4 py-3 text-sm leading-relaxed text-zinc-100">
                {WELCOME_MESSAGE}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 pl-11">
              {CHAT_SUGGESTIONS.map((suggestion) => (
                <CopilotSuggestion
                  key={suggestion.title}
                  type="button"
                  disabled={isStarting}
                  onClick={() => void startConversation(suggestion.message)}
                >
                  {suggestion.title}
                </CopilotSuggestion>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="pointer-events-auto m-4 flex items-end gap-2"
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask me anything..."
              rows={1}
              disabled={isStarting}
              className="min-h-10 flex-1 resize-none rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#E6C547]/40"
            />
            <button
              type="submit"
              disabled={isStarting || !input.trim()}
              className="flex size-10 items-center justify-center rounded-xl border border-white/10 text-zinc-300 transition hover:border-[#E6C547]/40 hover:text-white disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
};

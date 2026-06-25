"use client";

// Libs
import { useState } from "react";

import { cn } from "@repo/utils";
import { AGENT_KEYS } from "@repo/constants";
import { ChatProvider } from "@/features/chat/providers/chat-provider";

// Components
import { Navbar } from "@/components/layouts";
import { ChatSidebar, ThreadSidebar } from "@/features/chat/components";

type MainLayoutProps = {
  children: React.ReactNode;
  className?: string;
};

export const MainLayout = ({ children, className }: MainLayoutProps) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex h-screen w-full justify-center mx-2 bg-[#010507]">
      <div
        className={cn(
          "flex flex-col h-full w-full max-w-[1920px] overflow-hidden  bg-[#010507] font-sans",
          className
        )}
      >
        <Navbar />
        <div className="flex min-h-0 min-w-0 flex-1">
          <ChatProvider agentId={AGENT_KEYS.HOMESTAY_ASSISTANT}>
            <ThreadSidebar open={open} onOpenChange={setOpen} />
            <main className="app-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-8 md:px-4">
              {children}
            </main>
            <div className="hidden h-full min-h-0 w-[min(100%,380px)] shrink-0 lg:block">
              <ChatSidebar
                className="h-full"
                agentId={AGENT_KEYS.HOMESTAY_ASSISTANT}
              />
            </div>
          </ChatProvider>
        </div>
      </div>
    </div>
  );
};

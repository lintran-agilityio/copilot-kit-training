// Libs
import { useState } from "react";

// Components
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { Navbar } from "@/components/layouts/components/Navbar";
import { cn } from "@/lib/utils";
import { ThreadSidebar } from "@/modules/chat/components/ThreadSidebar";
import { AGENT_KEYS } from "@repo/constants";
import { ChatProvider } from "@/modules/chat/provider";

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
          className,
        )}
      >
        <Navbar />
        <div className="flex min-w-0 flex-1">
          <ChatProvider agentId={AGENT_KEYS.HOMESTAY_ASSISTANT}>
            <ThreadSidebar open={open} onOpenChange={setOpen} />
          </ChatProvider>
          <main className="flex-1 overflow-y-auto px-6 py-8 md:px-4">
            {children}
          </main>
          <div className="hidden w-[min(100%,380px)] shrink-0 lg:block">
            <ChatSidebar className="h-full" agentId={AGENT_KEYS.HOMESTAY_ASSISTANT} />
          </div>
        </div>

      </div>
    </div>
  );
}

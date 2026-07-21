import {
  CopilotChatView,
  useCopilotChatConfiguration,
} from "@copilotkit/react-core/v2";

import { ChatAgentAvatar } from "@/features/chat/components/ChatAvatars";
import { cn } from "@repo/utils";

type ChatWelcomeScreenProps = React.ComponentProps<
  typeof CopilotChatView.WelcomeScreen
>;

export const ChatWelcomeScreen = ({
  input,
  suggestionView,
  className,
}: ChatWelcomeScreenProps) => {
  const labels = useCopilotChatConfiguration()?.labels;

  return (
    <div
      data-testid="copilot-welcome-screen"
      className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}
    >
      <div
        data-chat-messages
        className="app-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pt-6"
      >
        <div className="flex items-start gap-3">
          <ChatAgentAvatar />
          <p className="max-w-[85%] rounded-2xl bg-zinc-800/80 px-4 py-3 text-sm leading-relaxed text-zinc-100">
            {labels?.welcomeMessageText}
          </p>
        </div>
      </div>

      <div
        data-chat-footer
        className="shrink-0 border-t border-white/5 bg-[#0a0a0a]"
      >
        {suggestionView}
        {input}
      </div>
    </div>
  );
};

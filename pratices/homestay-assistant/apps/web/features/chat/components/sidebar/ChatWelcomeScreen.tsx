import {
  CopilotChatView,
  useCopilotChatConfiguration,
} from "@copilotkit/react-core/v2";

import { ChatAgentAvatar } from "@/features/chat/components/sidebar/ChatAvatars";
import { cn } from "@repo/utils";;

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
      className={cn("flex min-h-0 flex-1 flex-col", className)}
    >
      <div className="flex-1 overflow-y-auto px-4 pt-6">
        <div className="flex items-start gap-3">
          <ChatAgentAvatar />
          <p className="max-w-[85%] rounded-2xl bg-zinc-800/80 px-4 py-3 text-sm leading-relaxed text-zinc-100">
            {labels?.welcomeMessageText}
          </p>
        </div>

        <div className="mt-3 pl-11 [&_[data-testid=copilot-suggestions]]:pointer-events-auto">
          {suggestionView}
        </div>
      </div>

      <div className="shrink-0">{input}</div>
    </div>
  );
};

// Libs
import { MessageCircle } from "lucide-react";

type NewChatButtonProps = {
  onNewChatClick: () => void;
};

export const NewChatButton = ({ onNewChatClick }: NewChatButtonProps) => {
  return (
    <div className="flex flex-col gap-2 border border-border rounded-lg p-2">
      <button className="text-sm font-medium text-zinc-300 flex items-center gap-2" onClick={onNewChatClick}>
        <MessageCircle className="size-4" aria-label="message-circle" />
        New Chat
      </button>
    </div>
  );
};

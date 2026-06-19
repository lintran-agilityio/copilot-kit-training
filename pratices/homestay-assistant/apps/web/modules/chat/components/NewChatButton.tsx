type NewChatButtonProps = {
  onNewChatClick: () => void;
};

export const NewChatButton = ({ onNewChatClick }: NewChatButtonProps) => {
  return (
    <div className="flex flex-col gap-2">
      <button className="text-sm font-medium text-zinc-300" onClick={onNewChatClick}>New Chat</button>
    </div>
  );
};

type EmptyMessagesProps = {
  emptyMessage: string;
};

export const EmptyMessages = ({ emptyMessage }: EmptyMessagesProps) => {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-lg font-medium text-zinc-400">{emptyMessage}</p>
    </div>
  );
};

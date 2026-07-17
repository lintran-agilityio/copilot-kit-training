type EmptyMessagesProps = {
  emptyMessage: string;
};

export const EmptyMessages = ({ emptyMessage }: EmptyMessagesProps) => {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-red-300">{emptyMessage}</p>
    </div>
  );
};

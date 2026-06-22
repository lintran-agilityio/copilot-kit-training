import { Thread } from "@copilotkit/react-core/v2";

type ThreadItemProps = {
  thread: Thread;
  onItemSelect: () => void;
};

export const ThreadItem = ({
  thread,
  onItemSelect,
}: ThreadItemProps) => {
  return (
    <div className="flex flex-col gap-2">
      <button className="text-sm font-medium text-zinc-300" onClick={onItemSelect}>{thread.name}</button>
    </div>
  );
};

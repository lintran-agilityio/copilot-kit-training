import { Thread } from "@copilotkit/react-core/v2";

import { useActiveThread } from "../../hooks";
import { useThreadContext } from "../../contexts/thread-context";
import { useChatStore } from "../../stores/chat-store";

type ThreadItemProps = {
  thread: Thread;
};

export const ThreadItem = ({ thread }: ThreadItemProps) => {
  const { agentId } = useThreadContext();
  const { activeThreadId, scopeKey, setActiveThreadId } = useActiveThread(agentId);
  const setPreferDraftMode = useChatStore((state) => state.setPreferDraftMode);
  const isActive = activeThreadId === thread.id;

  return (
    <div className="flex flex-col gap-2">
      <button
        className={`${isActive ? "bg-muted" : ""} cursor-pointer rounded-md p-2 text-left text-sm text-zinc-300 hover:bg-zinc-800`}
        onClick={() => {
          if (scopeKey) {
            setPreferDraftMode(scopeKey, false);
          }
          setActiveThreadId(thread.id);
        }}
      >
        {thread.name ?? "New Conversation"}
      </button>
    </div>
  );
};

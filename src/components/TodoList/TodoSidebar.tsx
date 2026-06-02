"use client";

type TodoThreadSummary = {
  id: string;
  title: string;
};

type TodoSidebarProps = {
  threads: TodoThreadSummary[];
  currentThread: TodoThreadSummary | null | undefined;
  onCreate: () => void;
  onSelect: (threadId: string) => void;
};

export const TodoSidebar = ({
  threads,
  currentThread,
  onCreate,
  onSelect,
}: TodoSidebarProps) => {
  return (
    <aside className="w-72 border-r p-4">
      <button
        onClick={onCreate}
        className="w-full border rounded p-2 mb-4"
      >
        + New Todo Workspace
      </button>

      <div className="space-y-2">
        {threads.map((thread) => {
          const active =
            currentThread?.id === thread.id;

          return (
            <button
              key={thread.id}
              onClick={() => onSelect(thread.id)}
              className={`w-full text-left p-3 rounded border ${
                active
                  ? "bg-black text-white"
                  : ""
              }`}
            >
              {thread.title}
            </button>
          );
        })}
      </div>
    </aside>
  )
};
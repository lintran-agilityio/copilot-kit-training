type TodoThreadSidebarProps = {
  threads: { id: string; name?: string | null }[];
  activeThreadId: string;
  isLoading: boolean;
  hasMore: boolean;
  isFetchingMore: boolean;
  onFetchMore: () => void;
  onSelect: (threadId: string) => void;
  // onCreate: () => void;
  onRename: (threadId: string, name: string) => void;
  onArchive: (threadId: string) => void;
};

export const TodoThreadSidebar = ({
  threads,
  activeThreadId,
  isLoading,
  onSelect,
  hasMore,
  isFetchingMore,
  onFetchMore,
  // onCreate,
  onRename,
  onArchive,
}: TodoThreadSidebarProps) => {
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <aside className="col-span-2 border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Threads</h2>
        {/* <button
          type="button"
          onClick={onCreate}
          className="border rounded px-3 py-1 text-sm hover:bg-gray-50"
        >
          + New
        </button> */}
      </div>
      <div className="flex flex-wrap gap-2">
        {threads.length === 0 ? (
          <button
            type="button"
            onClick={() => onSelect(activeThreadId)}
            className="rounded border px-3 py-2 text-sm bg-black text-white"
          >
            New conversation
          </button>
        ) : (
          threads.map((thread) => (
            <div key={thread.id}>
              <p className="p-2 bg-aqua-500">{thread.name ?? "New conversation"}</p>
              <div className="flex gap-2">
                <button
                  disabled={isLoading}
                  className="border rounded px-3 py-1 text-sm hover:bg-gray-50 bg-blue-50"
                  onClick={() => onRename(thread.id, "Renamed")}
                >
                  Rename
                </button>
                <button
                  disabled={isLoading}
                  className="border rounded px-3 py-1 text-sm hover:bg-gray-50 bg-blue-50"
                  onClick={() => onArchive(thread.id)}
                >
                  Archive  
                </button>
              </div>
            </div>
          ))
        )}
        {hasMore && (
          <button
            disabled={isFetchingMore}
            className="border rounded px-3 py-1 text-sm hover:bg-gray-50 bg-blue-50"
            onClick={onFetchMore}
          >
            Load more
          </button>
        )}
      </div>
    </aside>
  );
};

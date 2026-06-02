interface DeleteConfirmationProps {
  status: string;
  result?: string;
  todoText?: string;
  todoId?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmation = ({
  status,
  result,
  todoText,
  todoId,
  onCancel,
  onConfirm
}: DeleteConfirmationProps) => {
  const isComplete = status === "complete";
  const isInProgress = status === "inProgress" || status === "running";

  if (isInProgress) {
    return (
      <div className="rounded-md border bg-gray-100 p-3 text-sm text-gray-700">
        Preparing delete confirmation...
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
        {result ?? "Deletion decision recorded."}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-md bg-white p-4 shadow-lg">
        <p className="font-medium text-red-700">Confirm delete</p>
        <p className="text-sm text-gray-700">
          {todoText
            ? `Are you sure you want to delete "${todoText}"?`
            : todoId
              ? `Are you sure you want to delete todo ${todoId}?`
              : "Are you sure you want to delete this todo?"}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-red-500 px-4 py-2 text-sm text-white"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
};

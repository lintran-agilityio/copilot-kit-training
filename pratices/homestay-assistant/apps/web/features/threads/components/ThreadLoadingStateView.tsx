"use client";

type ThreadLoadingStateViewProps = {
  errorMessage?: string | null;
  onRetry?: () => void;
};

export const ThreadLoadingStateView = ({
  errorMessage,
  onRetry,
}: ThreadLoadingStateViewProps) => {
  if (errorMessage) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-zinc-300">Couldn&apos;t load conversation</p>
        <p className="text-xs text-zinc-500">{errorMessage}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-zinc-200 transition hover:bg-white/5"
          >
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="text-sm text-zinc-300">Loading conversation</p>
      <p className="text-xs text-zinc-500">…</p>
    </div>
  );
};

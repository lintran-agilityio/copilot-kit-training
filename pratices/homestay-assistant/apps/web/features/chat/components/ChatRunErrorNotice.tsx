"use client";

type ChatRunErrorNoticeProps = {
  message: string;
  isRetrying: boolean;
  onRetry: () => void;
  onDismiss: () => void;
};

/**
 * Inline banner for a run that failed to start (e.g. the runtime could not
 * reach the Intelligence platform). The user message is still in the thread,
 * so Retry re-runs the agent rather than re-sending anything.
 */
export const ChatRunErrorNotice = ({
  message,
  isRetrying,
  onRetry,
  onDismiss,
}: ChatRunErrorNoticeProps) => {
  return (
    <div
      role="alert"
      className="mx-4 mt-3 flex items-center gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2"
    >
      <p className="min-w-0 flex-1 text-xs text-amber-200">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-zinc-100 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
      >
        {isRetrying ? "Retrying…" : "Retry"}
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="rounded-md px-1.5 py-1 text-xs text-zinc-400 transition hover:text-zinc-200 cursor-pointer"
      >
        ✕
      </button>
    </div>
  );
};

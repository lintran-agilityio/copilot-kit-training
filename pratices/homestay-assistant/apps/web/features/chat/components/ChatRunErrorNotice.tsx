"use client";

type ChatRunErrorNoticeProps = {
  message: string;
  isRetrying?: boolean;
  onRetry?: () => void;
  onDismiss: () => void;
};

/**
 * Inline banner for a chat action that could not start. Retry is optional —
 * run-start failures re-run the agent; busy-agent blocks only dismiss.
 */
export const ChatRunErrorNotice = ({
  message,
  isRetrying = false,
  onRetry,
  onDismiss,
}: ChatRunErrorNoticeProps) => {
  return (
    <div
      role="alert"
      className="mx-4 mt-3 flex items-center gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2"
    >
      <p className="min-w-0 flex-1 text-xs text-amber-200">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-zinc-100 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {isRetrying ? "Retrying…" : "Retry"}
        </button>
      ) : null}
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

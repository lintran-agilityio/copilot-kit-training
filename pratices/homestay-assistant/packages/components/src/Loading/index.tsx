import { Loader2 } from "lucide-react";

const ITEM_COUNT = 3;
const STAGGER_MS = 180;

export const Loading = () => {
  return (
    <div
      className="flex items-center justify-center gap-2 px-2 py-3"
      role="status"
      aria-label="Loading"
      aria-live="polite"
    >
      <style>{`
        @keyframes loading-grow {
          0%,
          100% {
            transform: scale(0.7);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .loading-grow-item {
            animation: none !important;
            transform: scale(1);
            opacity: 0.7;
          }
        }
      `}</style>

      {Array.from({ length: ITEM_COUNT }, (_, index) => (
        <Loader2
          key={index}
          className={`loading-grow-item size-${5+index} shrink-0 text-zinc-500`}
          style={{
            animation: "loading-grow 1.1s ease-in-out infinite",
            animationDelay: `${index * STAGGER_MS}ms`,
          }}
        />
      ))}
    </div>
  );
};

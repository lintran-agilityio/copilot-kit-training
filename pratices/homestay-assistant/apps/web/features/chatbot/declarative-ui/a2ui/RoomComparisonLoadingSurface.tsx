import { ChatAgentAvatar } from "@/features/chatbot/components/ChatAvatars";
import { EmbeddedWidget } from "@/features/chatbot/components/EmbeddedWidget";

/**
 * One placeholder room card. Mirrors the real `RoomComparison` card shape
 * (title + price, location line, four highlight rows, availability footer) so
 * the skeleton keeps its height when the surface paints over it.
 */
const SkeletonRoomCard = () => (
  <div className="flex h-full flex-col rounded-xl border border-border bg-background/60 p-2.5">
    <div className="flex items-start justify-between gap-2">
      <div className="h-3.5 w-20 animate-pulse rounded-full bg-muted" />
      <div className="h-4 w-9 animate-pulse rounded-full bg-muted/70" />
    </div>
    <div className="mt-2 h-2.5 w-14 animate-pulse rounded-full bg-muted/60" />
    <ul className="mt-3 min-h-[4.75rem] space-y-1.5">
      <li className="flex items-center gap-1.5">
        <span className="size-1 shrink-0 rounded-full bg-muted/70" />
        <span className="h-2.5 w-full animate-pulse rounded-full bg-muted/60" />
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-1 shrink-0 rounded-full bg-muted/70" />
        <span className="h-2.5 w-5/6 animate-pulse rounded-full bg-muted/60" />
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-1 shrink-0 rounded-full bg-muted/70" />
        <span className="h-2.5 w-4/6 animate-pulse rounded-full bg-muted/60" />
      </li>
    </ul>
    <div className="mt-auto border-t border-border pt-2">
      <div className="h-2.5 w-14 animate-pulse rounded-full bg-muted/70" />
    </div>
  </div>
);

/**
 * Loading state for the `RoomComparison` A2UI surface.
 *
 * Replaces CopilotKit's generic "Building interface" skeleton (passed via the
 * provider's `a2ui.loadingComponent`) so a comparison-in-progress reads like
 * every other in-chat result: an assistant avatar next to a framed card at the
 * shared chat width, shaped like the comparison grid it becomes.
 */
export const RoomComparisonLoadingSurface = () => (
  <div
    data-chat-message-row="assistant"
    className="flex items-start justify-start gap-3 px-3 pt-3"
  >
    <ChatAgentAvatar />
    <div className="min-w-0 flex-1">
      <EmbeddedWidget unframed className="max-w-[min(100%,420px)]">
        <section
          aria-busy="true"
          aria-label="Building room comparison"
          className="max-w-full space-y-3 rounded-xl border border-border bg-card p-3.5"
        >
          <div className="flex items-center gap-2">
            <span className="h-4 w-1 shrink-0 rounded-full bg-gold/40" />
            <div className="h-4 w-40 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="grid auto-rows-fr grid-cols-2 gap-2.5">
            {Array.from({ length: 4 }, (_, index) => (
              <SkeletonRoomCard key={`compare-skeleton-${index}`} />
            ))}
          </div>
        </section>
      </EmbeddedWidget>
    </div>
  </div>
);

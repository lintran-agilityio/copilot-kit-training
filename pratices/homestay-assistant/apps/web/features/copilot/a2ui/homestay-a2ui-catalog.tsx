import { createCatalog, type RendererProps } from "@copilotkit/a2ui-renderer";
import { z } from "zod";

import { cn } from "@repo/utils";
import { ChatAgentAvatar } from "@/features/chat/components/ChatAvatars";
import { EmbeddedWidget } from "@/features/chat/components/EmbeddedWidget";

const roomComparisonPropsSchema = z.object({
  eyebrow: z
    .string()
    .optional()
    .describe("A short label, such as 'Your shortlisted stays'."),
  title: z
    .string()
    .describe("A concise heading that helps the guest compare options."),
  note: z
    .string()
    .optional()
    .describe("Optional context about the comparison or the guest request."),
  rooms: z
    .array(
      z.object({
        id: z.string().describe("The stable room id."),
        name: z.string().describe("The room name."),
        location: z
          .string()
          .optional()
          .describe("Optional location or area label."),
        nightlyRate: z
          .string()
          .optional()
          .describe("A preformatted nightly price supplied by the agent."),
        availability: z
          .string()
          .optional()
          .describe(
            "A preformatted availability status supplied by the agent.",
          ),
        highlights: z
          .array(z.string())
          .max(5)
          .optional()
          .describe("Up to five factual room highlights."),
      }),
    )
    .min(1)
    .max(4)
    .describe("One to four verified rooms to compare."),
});

type RoomComparisonProps = z.infer<typeof roomComparisonPropsSchema>;

/**
 * Highlights rendered per card. Capped so a room with five facts does not make
 * its card taller than a room with one — the grid rows are already locked to a
 * single height (`auto-rows-fr`) and the list reserves its own min-height.
 */
const HIGHLIGHT_LIMIT = 4;

/** Non-breaking space — holds the row height when an optional line is absent. */
const PLACEHOLDER = " ";

/**
 * Renders a room comparison surface from verified agent-provided values.
 *
 * Chrome matches the in-chat Room List: an assistant avatar next to a framed
 * card at the shared chat zoom (gold rule + serif heading). This mirrors the
 * `data-chat-message-row="assistant"` row `ChatAssistantMessage` wraps a
 * tool-only turn in, and the identical row in `RoomComparisonLoadingSurface`,
 * so the avatar stays put when the surface paints over the skeleton. Every
 * card is `flex h-full flex-col` inside an `auto-rows-fr` grid and every
 * optional line (location, highlights, availability) reserves a fixed slot, so
 * the layout never shifts with how much detail a given room carries.
 */
const RoomComparison = ({ props }: RendererProps<RoomComparisonProps>) => {
  const { eyebrow, note, rooms, title } = props;

  return (
    <div
      data-chat-message-row="assistant"
      className="flex items-start justify-start gap-3 px-3 pt-3"
    >
      <ChatAgentAvatar />
      <div className="min-w-0 flex-1">
        <EmbeddedWidget unframed className="max-w-[min(100%,420px)]">
          <section className="max-w-full space-y-3 rounded-xl border border-border bg-card p-3.5 text-card-foreground">
            <header className="space-y-1.5">
              {eyebrow ? (
                <p className="text-[10px] font-semibold tracking-[0.14em] text-gold uppercase">
                  {eyebrow}
                </p>
              ) : null}
              <div className="flex items-center gap-2">
                <span className="h-4 w-1 shrink-0 rounded-full bg-gold" />
                <h3 className="font-serif text-lg leading-tight font-medium text-foreground">
                  {title}
                </h3>
              </div>
              {note ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {note}
                </p>
              ) : null}
            </header>

            <div
              className={cn(
                "grid auto-rows-fr gap-2.5",
                rooms?.length === 1 ? "grid-cols-1" : "grid-cols-2",
              )}
            >
              {rooms?.map((room) => {
                const highlights = (room.highlights ?? []).slice(
                  0,
                  HIGHLIGHT_LIMIT,
                );

                return (
                  <article
                    key={room.id}
                    className="flex h-full flex-col rounded-xl border border-border bg-background/60 p-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="line-clamp-2 font-serif text-sm leading-tight font-medium text-foreground">
                        {room.name}
                      </h4>
                      {room.nightlyRate ? (
                        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                          {room.nightlyRate}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-0.5 line-clamp-1 min-h-4 text-xs text-muted-foreground">
                      {room.location || PLACEHOLDER}
                    </p>

                    <ul className="mt-2 min-h-[4.75rem] space-y-1 text-xs text-muted-foreground">
                      {highlights.map((highlight) => (
                        <li key={highlight} className="flex gap-1.5">
                          <span
                            aria-hidden
                            className="mt-1.5 size-1 shrink-0 rounded-full bg-gold"
                          />
                          <span className="line-clamp-1">{highlight}</span>
                        </li>
                      ))}
                    </ul>

                    <p className="mt-auto min-h-4 border-t border-border pt-2 text-[11px] font-medium text-primary">
                      {room.availability || PLACEHOLDER}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        </EmbeddedWidget>
      </div>
    </div>
  );
};

/**
 * A2UI surface for comparing verified room options without exposing any booking
 * mutation controls. The main agent remains responsible for availability and
 * booking decisions; this surface only presents information it already found.
 */
export const homestayA2UICatalog = createCatalog(
  {
    RoomComparison: {
      description:
        "A compact comparison of up to four rooms. Use only with room details already returned by the homestay tools; never invent prices, availability, or amenities. This is informational and must not be used to confirm or create a booking.",
      props: roomComparisonPropsSchema,
    },
  },
  {
    RoomComparison,
  },
  { catalogId: "homestay-assistant" },
);

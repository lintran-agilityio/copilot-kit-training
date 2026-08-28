import { createCatalog, type RendererProps } from "@copilotkit/a2ui-renderer";
import { z } from "zod";

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

/** Renders a room comparison surface from verified agent-provided values. */
const RoomComparison = ({ props }: RendererProps<RoomComparisonProps>) => {
  const { eyebrow, note, rooms, title } = props;
  return (
    <section className="w-full rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm">
      <header className="mb-4 space-y-1">
        {eyebrow ? (
          <p className="text-xs font-semibold tracking-[0.14em] text-gold uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h3 className="font-heading text-2xl leading-tight">{title}</h3>
        {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {rooms.length &&
          rooms.map((room) => {
            const { location, highlights, availability, nightlyRate } = room;
            
            return (
              <article
                key={room.id}
                className="rounded-xl border border-border bg-background/60 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold">{room.name}</h4>
                    {location ? (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {location}
                      </p>
                    ) : null}
                  </div>
                  {nightlyRate ? (
                    <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                      {nightlyRate}
                    </span>
                  ) : null}
                </div>

                {highlights?.length ? (
                  <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    {highlights.map((highlight) => (
                      <li key={highlight} className="flex gap-2">
                        <span aria-hidden className="text-gold">
                          &bull;
                        </span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {availability ? (
                  <p className="mt-3 border-t border-border pt-3 text-xs font-medium text-primary">
                    {availability}
                  </p>
                ) : null}
              </article>
            );
          })}
      </div>
    </section>
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

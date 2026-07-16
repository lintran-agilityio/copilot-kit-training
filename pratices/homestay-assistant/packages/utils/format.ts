export const formatPrice = (pricePerNight?: number) => {
  if (pricePerNight == null) {
    return null;
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(pricePerNight);
};

export const countNightOfDates = (checkIn: string, checkOut: string) => {
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  return Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );
};

type BuildActionPromptArgs = {
  action: string;
  targetName: string;
  identifiers: Record<string, string>;
};

export const buildActionPrompt = ({
  action,
  targetName,
  identifiers,
}: BuildActionPromptArgs) => {
  const metadata = Object.entries(identifiers)
    .map(([key, value]) => `${key}: ${value}`)
    .join(". ");

  return `${action} ${targetName}. ${metadata}`;
};

/** Strip trailing punctuation/whitespace LLMs may include when parsing action prompts. */
export const sanitizeBookingId = (raw: string) =>
  raw.trim().replace(/[.,;\s]+$/g, "");

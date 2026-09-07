import type { ClientIdentity } from "@repo/schemas";

/**
 * Optional `## GUEST` block prepended to the system prompt when the browser
 * forwarded a reconciled identity with a usable name or email.
 *
 * Personalization only. The block spells out that the model must not infer
 * booking ownership from it — the eval harness never sets `forwardedProps`, so
 * this is a no-op there and cannot shift deterministic runs.
 *
 * Prepended OUTSIDE buildHomestayAssistantPrompt / withDateContext so it never
 * disturbs the golden playbook section order.
 */
export const withGuestContext = (
  basePrompt: string,
  identity: ClientIdentity | undefined,
): string => {
  const name = identity?.firstName ?? identity?.fullName ?? undefined;
  const email = identity?.email ?? undefined;

  if (!name && !email) {
    return basePrompt;
  }

  const lines = ["## GUEST"];
  if (name) lines.push(`Name: ${name}`);
  if (email) lines.push(`Email: ${email}`);
  lines.push(
    "Use only to address the guest naturally. Do not assume which bookings or rooms are theirs from this — always resolve bookings through tools.",
  );

  return `${lines.join("\n")}\n\n${basePrompt}`;
};

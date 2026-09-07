"use client";

import { useEffect, useMemo } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useCopilotKit } from "@copilotkit/react-core/v2";

import { clientIdentitySchema, type ClientIdentity } from "@repo/schemas";

import { generateId } from "@/utils";

const CLIENT_SESSION_STORAGE_KEY = "homestay.chat.clientSessionId";

/**
 * A uuid that stays stable for the life of one browser tab, so a whole run chain
 * can be traced in the agent logs. Falls back to a fresh id (not persisted) when
 * sessionStorage is unavailable — private windows, blocked storage, SSR.
 */
const getClientSessionId = (): string | undefined => {
  if (typeof window === "undefined") return undefined;

  try {
    const existing = window.sessionStorage.getItem(CLIENT_SESSION_STORAGE_KEY);
    if (existing) return existing;

    const next = generateId();
    window.sessionStorage.setItem(CLIENT_SESSION_STORAGE_KEY, next);
    return next;
  } catch {
    return generateId();
  }
};

/**
 * Forwards the signed-in guest's identity to the agent via CopilotKit v2
 * `properties` — it ships as AG-UI `forwardedProps.identity` on every run and
 * HITL resume. The agent route handler reconciles `userId` against the verified
 * Clerk token before trusting any of it (see
 * apps/agent/src/mastra/middleware/client-identity.ts).
 *
 * Kept in `properties` imperatively (merging, never replacing) so the A2UI keys
 * the provider owns — `a2uiCatalogAvailable`, the transient `a2uiAction` — are
 * untouched, mirroring how `ClerkTokenSync` merges headers.
 *
 * `<CopilotKitProvider>`'s own mount effect calls `setProperties(...)` once with
 * just its A2UI flag, and that commit can land after this component's first
 * effect (warm Clerk session), so re-assert on every `onPropertiesChanged` until
 * our `identity` is present. The reference-equality guard makes it converge in
 * one extra write and never loop.
 */
export const ClientIdentitySync = () => {
  const { isLoaded: isAuthLoaded, userId, sessionId } = useAuth();
  const { isLoaded: isUserLoaded, user } = useUser();
  const { copilotkit } = useCopilotKit();

  const identity = useMemo<ClientIdentity | null>(() => {
    if (!isAuthLoaded || !isUserLoaded || !userId) return null;

    const candidate: ClientIdentity = {
      userId,
      sessionId: sessionId ?? null,
      email: user?.primaryEmailAddress?.emailAddress ?? null,
      firstName: user?.firstName ?? null,
      fullName: user?.fullName ?? null,
      clientSessionId: getClientSessionId() ?? null,
    };

    const parsed = clientIdentitySchema.safeParse(candidate);
    return parsed.success ? parsed.data : null;
  }, [
    isAuthLoaded,
    isUserLoaded,
    userId,
    sessionId,
    user?.primaryEmailAddress?.emailAddress,
    user?.firstName,
    user?.fullName,
  ]);

  useEffect(() => {
    if (!identity) return;

    const ensureIdentity = () => {
      if (copilotkit.properties.identity === identity) return;
      copilotkit.setProperties({ ...copilotkit.properties, identity });
    };

    ensureIdentity();
    const subscription = copilotkit.subscribe({
      onPropertiesChanged: ensureIdentity,
    });

    return () => subscription.unsubscribe();
  }, [copilotkit, identity]);

  return null;
};

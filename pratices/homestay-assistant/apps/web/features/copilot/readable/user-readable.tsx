"use client";

import { useUser } from "@clerk/nextjs";
import { useAgentContext } from "@copilotkit/react-core/v2";
import { useMemo } from "react";

export const UserReadable = () => {
  const { user, isLoaded } = useUser();

  const contextValue = useMemo(
    () =>
      isLoaded && user?.id
        ? { userId: user.id, email: user.primaryEmailAddress?.emailAddress ?? null }
        : null,
    [isLoaded, user?.id, user?.primaryEmailAddress?.emailAddress],
  );

  useAgentContext({
    description: "Signed-in user for booking operations",
    value: contextValue,
  });

  return null;
};

"use client";

import { CopilotKit } from "@copilotkit/react-core/v2";

import { AGENT_KEYS, AGENT_URLS } from "@repo/constants";
import { AppProvider } from "@/providers/app-provider";

type AuthenticatedCopilotShellProps = {
  children: React.ReactNode;
};

/**
 * Isolated chunk: CopilotKit + tool providers only load after auth.
 */
export const AuthenticatedCopilotShell = ({
  children,
}: AuthenticatedCopilotShellProps) => {
  return (
    <CopilotKit
      agent={AGENT_KEYS.MANAGE_ASSISTANT}
      credentials="include"
      runtimeUrl={AGENT_URLS.MANAGE_ASSISTANT}
    >
      <AppProvider>{children}</AppProvider>
    </CopilotKit>
  );
};

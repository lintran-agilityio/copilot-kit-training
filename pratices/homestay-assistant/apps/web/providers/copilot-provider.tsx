"use client";

import { CopilotKit } from "@copilotkit/react-core/v2";
import { AGENT_KEYS, AGENT_URLS } from "@repo/constants";
import { AppProvider } from "./app-provider";

type CopilotKitProvidersProps = {
  children: React.ReactNode;
};

const CopilotKitProviders = ({ children }: CopilotKitProvidersProps) => {
  return (
    <CopilotKit
      agent={AGENT_KEYS.HOMESTAY_ASSISTANT}
      runtimeUrl={AGENT_URLS.HOMESTAY_ASSISTANT}
    >
      <AppProvider>
        {children}
      </AppProvider>
    </CopilotKit>
  );
};

export default CopilotKitProviders;

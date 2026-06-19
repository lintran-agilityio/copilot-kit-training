"use client";

import { CopilotKit } from "@copilotkit/react-core/v2";
import { AGENT_KEYS, AGENT_URLS } from "@repo/constants";

const CopilotKitProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <CopilotKit
      agent={AGENT_KEYS.HOMESTAY_ASSISTANT}
      runtimeUrl={AGENT_URLS.HOMESTAY_ASSISTANT}
    >
      {children}
    </CopilotKit>
  );
};

export default CopilotKitProviders;

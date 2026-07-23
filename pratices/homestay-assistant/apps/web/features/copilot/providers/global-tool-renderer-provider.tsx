"use client";

import { useRenderTool } from "@copilotkit/react-core/v2";

import { AGENT_KEYS } from "@repo/constants";
import { UnknownToolRenderer } from "@/features/copilot/components";

export const GlobalToolRendererProvider = () => {
  useRenderTool(
    {
      agentId: AGENT_KEYS.MANAGE_ASSISTANT,
      name: "*",
      render: ({ status, result }) => (
        <UnknownToolRenderer
          status={status}
          result={result as unknown}
        />
      ),
    },
    [],
  );

  return null;
};
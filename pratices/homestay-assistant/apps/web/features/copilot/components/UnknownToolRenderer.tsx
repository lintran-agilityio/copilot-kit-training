"use client";

import { ToolCallStatus } from "@copilotkit/react-core/v2";

type UnknownToolRendererProps = {
  status: ToolCallStatus;
  result: unknown;
};

export const UnknownToolRenderer = ({
  status,
  result,
}: UnknownToolRendererProps) => {
  if (status === ToolCallStatus.InProgress) {
    return (
      <div className="text-muted-foreground text-sm">
        Processing...
      </div>
    );
  }

  if (status !== ToolCallStatus.Complete) {
    return null;
  }
  
  if (process.env.NODE_ENV === "development") {
    console.warn("[Unknown CopilotKit tool renderer]", {
      result,
    });
  }

  return null;
};

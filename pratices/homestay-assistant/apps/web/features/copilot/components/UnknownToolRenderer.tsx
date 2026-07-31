"use client";

import { CHAT_VISIBLE_GENERATIVE_TOOLS } from "@/features/copilot/config/page-generative-ui";

type UnknownToolRendererProps = {
  name: string;
  status: "inProgress" | "executing" | "complete";
  result: string | undefined;
};

export const UnknownToolRenderer = ({
  name,
  status,
  result,
}: UnknownToolRendererProps) => {
  if (CHAT_VISIBLE_GENERATIVE_TOOLS.has(name)) {
    return null;
  }

  if (status === "inProgress") {
    return (
      <div className="text-muted-foreground text-sm">Processing...</div>
    );
  }

  if (status !== "complete") {
    return null;
  }

  if (process.env.NODE_ENV === "development") {
    console.warn("[Unknown CopilotKit tool renderer]", { name, result });
  }

  return null;
};

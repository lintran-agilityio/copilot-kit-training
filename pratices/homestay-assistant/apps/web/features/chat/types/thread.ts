export type ChatThread = {
  id: string;
  agentId: string;
  name: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  messageCount: number;
};

export type ChatMessage = {
  id: string;
  role: "assistant" | "system" | "tool" | "user";
  content: string;
};

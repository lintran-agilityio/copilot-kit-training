/**
 * Loose transcript shapes shared by chat normalize / booking derive / picker utils.
 * Permissive optional fields — only what parsers actually read.
 */

export type ToolCallLike = {
  id?: string;
  type?: string;
  name?: string;
  function?: {
    name?: string;
    /** CopilotKit may leave args as opaque JSON until normalize. */
    arguments?: unknown;
  };
  /** AG-UI / OpenAI-style */
  arguments?: unknown;
  /** AI SDK tool-call shape */
  args?: unknown;
};

export type MessageContentLike =
  | string
  | Array<{ type?: string; text?: string }>
  | Record<string, unknown>
  | null
  | undefined;

export type MessageLike = {
  id?: string;
  role?: string;
  /** CopilotKit / AG-UI content is opaque at the transcript boundary. */
  content?: unknown;
  toolCallId?: string;
  toolCalls?: ToolCallLike[];
  metadata?: Record<string, unknown>;
};

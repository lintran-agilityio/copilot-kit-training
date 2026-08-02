type CopilotKitToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

const toArgumentsString = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }

  if (value === undefined || value === null) {
    return "{}";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return "{}";
};

const extractFirstJsonObject = (args: string) => {
  const start = args.indexOf("{");

  if (start === -1) {
    return "{}";
  }

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = start; index < args.length; index += 1) {
    const char = args[index];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (char === "\\") {
        isEscaped = true;
        continue;
      }

      if (char === '"') {
        inString = false;
      }

      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
    }

    if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return args.slice(start, index + 1);
      }
    }
  }

  return "{}";
};

const sanitizeToolArguments = (value: unknown) => {
  const args = toArgumentsString(value).trim();

  if (!args) {
    return "{}";
  }

  try {
    JSON.parse(args);
    return args;
  } catch {
    const candidate = extractFirstJsonObject(args);

    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      return "{}";
    }
  }
};

const normalizeToolCall = (toolCall: unknown): CopilotKitToolCall | null => {
  if (!toolCall || typeof toolCall !== "object") {
    return null;
  }

  const candidate = toolCall as Record<string, unknown>;
  const id = candidate.id;

  if (typeof id !== "string") {
    return null;
  }

  if (candidate.function && typeof candidate.function === "object") {
    const fn = candidate.function as Record<string, unknown>;

    if (typeof fn.name === "string") {
      return {
        id,
        type: "function",
        function: {
          name: fn.name,
          arguments: sanitizeToolArguments(fn.arguments),
        },
      };
    }
  }

  if (typeof candidate.name === "string") {
    return {
      id,
      type: "function",
      function: {
        name: candidate.name,
        arguments: sanitizeToolArguments(candidate.args),
      },
    };
  }

  return null;
};

const normalizeMessage = <TMessage>(message: TMessage): TMessage => {
  if (!message || typeof message !== "object") {
    return message;
  }

  const candidate = message as Record<string, unknown>;

  if (candidate.role !== "assistant" || !Array.isArray(candidate.toolCalls)) {
    return message;
  }

  const toolCalls = candidate.toolCalls
    .map(normalizeToolCall)
    .filter((toolCall): toolCall is CopilotKitToolCall => toolCall !== null);

  if (toolCalls.length === 0) {
    const rest = { ...candidate };
    delete rest.toolCalls;

    return rest as TMessage;
  }

  return {
    ...candidate,
    toolCalls,
  } as TMessage;
};

const getMessageContent = (message: { content?: unknown }) => {
  if (typeof message.content === "string") {
    return message.content;
  }

  return "";
};

const mergeAssistantDuplicates = <TMessage extends { id: string; role?: string; content?: unknown; toolCalls?: unknown }>(
  existing: TMessage,
  incoming: TMessage,
): TMessage => {
  const existingContent = getMessageContent(existing).trim();
  const incomingContent = getMessageContent(incoming).trim();
  // Prefer non-empty text so hydration/live races do not wipe a finished reply.
  const content = incomingContent || existingContent || getMessageContent(incoming) || getMessageContent(existing);

  const existingToolCalls = Array.isArray(existing.toolCalls)
    ? existing.toolCalls
    : undefined;
  const incomingToolCalls = Array.isArray(incoming.toolCalls)
    ? incoming.toolCalls
    : undefined;
  const toolCalls =
    (incomingToolCalls?.length ? incomingToolCalls : undefined) ??
    (existingToolCalls?.length ? existingToolCalls : undefined);

  return {
    ...existing,
    ...incoming,
    content,
    ...(toolCalls ? { toolCalls } : {}),
  };
};

/**
 * Merge live agent messages with hydrated thread history.
 * Same-id assistant rows keep the richer content/toolCalls instead of
 * letting an empty hydration payload overwrite a finished reply.
 */
export const mergeHydratedMessages = <
  TMessage extends { id: string; role?: string; content?: unknown; toolCalls?: unknown },
>(
  liveMessages: TMessage[],
  hydratedMessages: TMessage[],
): TMessage[] => {
  if (!liveMessages.length) {
    return hydratedMessages;
  }

  if (!hydratedMessages.length) {
    return liveMessages;
  }

  const byId = new Map<string, TMessage>();

  for (const message of hydratedMessages) {
    byId.set(message.id, message);
  }

  for (const message of liveMessages) {
    const existing = byId.get(message.id);

    if (!existing) {
      byId.set(message.id, message);
      continue;
    }

    if (message.role === "assistant" && existing.role === "assistant") {
      byId.set(message.id, mergeAssistantDuplicates(existing, message));
      continue;
    }

    byId.set(message.id, message);
  }

  const orderedIds: string[] = [];
  const seen = new Set<string>();

  for (const message of [...hydratedMessages, ...liveMessages]) {
    if (seen.has(message.id)) {
      continue;
    }

    seen.add(message.id);
    orderedIds.push(message.id);
  }

  return orderedIds.map((id) => byId.get(id)!);
};

export const normalizeMessages = <TMessage extends { role?: string; content?: unknown }>(
  messages: TMessage[],
): TMessage[] => messages.map(normalizeMessage);

export const normalize = (value: string) => {
  return value.trim().replace(/[^\w\s]/g, "").toLocaleLowerCase();
};

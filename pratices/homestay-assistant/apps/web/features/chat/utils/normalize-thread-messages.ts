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

const normalizeThreadMessage = <TMessage>(message: TMessage): TMessage => {
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
    const { toolCalls: _toolCalls, ...rest } = candidate;
    return rest as TMessage;
  }

  return {
    ...candidate,
    toolCalls,
  } as TMessage;
};

export const normalizeThreadMessages = <TMessage>(
  messages: TMessage[],
): TMessage[] => messages.map(normalizeThreadMessage);

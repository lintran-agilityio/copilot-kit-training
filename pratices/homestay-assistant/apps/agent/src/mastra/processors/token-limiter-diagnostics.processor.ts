import { TripWire } from "@mastra/core/agent";
import type {
  ProcessInputStepArgs,
  Processor,
  TokenLimiterOptions,
} from "@mastra/core/processors";
import { TokenLimiterProcessor } from "@mastra/core/processors";
import {
  AGENT_INPUT_TOKEN_LIMIT,
  AGENT_MAX_OUTPUT_TOKEN_LIMIT,
  TOKEN_LIMITER_TRIPWIRE_REASON_PREFIX,
} from "@repo/constants";

/** Rough char/4 estimate — labeled as approx; TripWire metadata is authoritative. */
const approxTokensFromChars = (charLength: number) =>
  Math.ceil(Math.max(0, charLength) / 4);

const PREVIEW_MAX = 48;

const truncatePreview = (text: string) => {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= PREVIEW_MAX) {
    return normalized;
  }
  return `${normalized.slice(0, PREVIEW_MAX)}…`;
};

const extractMessageTextPreview = (message: {
  content?: unknown;
}): string => {
  const content = message.content;

  if (typeof content === "string") {
    return truncatePreview(content);
  }

  if (!content || typeof content !== "object") {
    return "";
  }

  const record = content as {
    content?: unknown;
    parts?: Array<{ type?: string; text?: string }>;
  };

  if (typeof record.content === "string" && record.content.trim()) {
    return truncatePreview(record.content);
  }

  if (Array.isArray(record.parts)) {
    const text = record.parts
      .filter((part) => part.type === "text" && typeof part.text === "string")
      .map((part) => part.text)
      .join(" ");
    return truncatePreview(text);
  }

  return "";
};

const serializeLength = (value: unknown) => {
  try {
    return JSON.stringify(value)?.length ?? 0;
  } catch {
    return 0;
  }
};

const readTripwireMetadata = (error: TripWire) => {
  const metadata = error.options?.metadata;
  if (!metadata || typeof metadata !== "object") {
    return {} as Record<string, unknown>;
  }
  return metadata as Record<string, unknown>;
};

/**
 * TEMPORARY diagnostics wrapper around Mastra TokenLimiterProcessor.
 * Logs structured budget evidence on TripWire, then rethrows unchanged.
 * Do not change limit/trimMode here — investigation only.
 */
export class TokenLimiterWithDiagnosticsProcessor implements Processor {
  id = "token-limiter";

  name = "Token Limiter (diagnostics)";

  readonly #inner: TokenLimiterProcessor;

  readonly #limit: number;

  readonly #trimMode: NonNullable<TokenLimiterOptions["trimMode"]>;

  constructor(options: {
    limit: number;
    trimMode: NonNullable<TokenLimiterOptions["trimMode"]>;
  }) {
    this.#limit = options.limit;
    this.#trimMode = options.trimMode;
    this.#inner = new TokenLimiterProcessor({
      limit: options.limit,
      trimMode: options.trimMode,
    });
  }

  async processInputStep(args: ProcessInputStepArgs) {
    try {
      return await this.#inner.processInputStep(args);
    } catch (error) {
      if (
        error instanceof TripWire &&
        error.message.startsWith(TOKEN_LIMITER_TRIPWIRE_REASON_PREFIX)
      ) {
        this.#logDiagnostics(args, error);
      }

      throw error;
    }
  }

  #logDiagnostics(args: ProcessInputStepArgs, error: TripWire) {
    const metadata = readTripwireMetadata(error);
    const messageList = args.messageList;
    const dbMessages =
      typeof messageList?.get?.all?.db === "function"
        ? messageList.get.all.db()
        : [];
    const systemMessages =
      typeof messageList?.getAllSystemMessages === "function"
        ? messageList.getAllSystemMessages()
        : (args.systemMessages ?? []);

    const systemMessageSummaries = systemMessages.map((message, index) => {
      const content =
        typeof message.content === "string"
          ? message.content
          : JSON.stringify(message.content ?? "");
      return {
        index,
        role: message.role,
        approxTokens: approxTokensFromChars(content.length),
        charLength: content.length,
        preview: truncatePreview(content),
      };
    });

    const systemApproxTokens = systemMessageSummaries.reduce(
      (sum, entry) => sum + entry.approxTokens,
      0,
    );

    const messageSummaries = dbMessages.map((message, index) => {
      const contentCharLength = serializeLength(message.content);
      return {
        index,
        id: typeof message.id === "string" ? message.id : undefined,
        role: message.role,
        approxTokens: approxTokensFromChars(contentCharLength),
        contentCharLength,
        preview: extractMessageTextPreview(message),
      };
    });

    const messagesApproxTokens = messageSummaries.reduce(
      (sum, entry) => sum + entry.approxTokens,
      0,
    );

    const toolEntries = Object.entries(args.tools ?? {});
    const toolsApproxChars = toolEntries.reduce(
      (sum, [, tool]) => sum + serializeLength(tool),
      0,
    );

    const stepArgs = args as ProcessInputStepArgs & {
      threadId?: string;
    };

    const diagnostics = {
      tag: "[TokenLimiterDiagnostics]",
      temporary: true,
      reason: error.message,
      tripwireMetadata: metadata,
      configured: {
        limit: this.#limit,
        trimMode: this.#trimMode,
        agentInputTokenLimitConstant: AGENT_INPUT_TOKEN_LIMIT,
        agentMaxOutputTokenLimit: AGENT_MAX_OUTPUT_TOKEN_LIMIT,
        note: "maxOutputTokens is agent modelSettings — TokenLimiter does not reserve it in remainingBudget",
      },
      step: {
        stepNumber: args.stepNumber,
        retryCount: args.retryCount,
        threadId: stepArgs.threadId,
        messageId: args.messageId,
      },
      budget: {
        systemTokensFromTripwire: metadata.systemTokens,
        remainingBudgetFromTripwire: metadata.remainingBudget,
        limitFromTripwire: metadata.limit,
        messageCountFromTripwire: metadata.messageCount,
        systemApproxTokens,
        messagesApproxTokens,
        totalApproxTokensExcludingTools:
          systemApproxTokens + messagesApproxTokens,
        tokensPerMessageConstant: 3.8,
        tokensPerConversationConstant: 24,
      },
      systemMessages: {
        count: systemMessageSummaries.length,
        messages: systemMessageSummaries,
      },
      conversationMessages: {
        count: messageSummaries.length,
        messages: messageSummaries,
      },
      tools: {
        count: toolEntries.length,
        names: toolEntries.map(([name]) => name),
        approxTokensIfSerialized: approxTokensFromChars(toolsApproxChars),
        note: "Tool schemas are NOT included in TokenLimiter systemTokens; they are sent separately to the model",
      },
      priorSteps: {
        completedStepCount: Array.isArray(args.steps) ? args.steps.length : 0,
      },
    };

    console.info(
      "[TokenLimiterDiagnostics] TripWire budget evidence",
      diagnostics,
    );
  }
}

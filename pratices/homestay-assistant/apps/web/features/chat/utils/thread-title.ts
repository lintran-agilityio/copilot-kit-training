const MAX_THREAD_TITLE_LENGTH = 60;

export const deriveThreadTitle = (content: string): string => {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (normalized.length <= MAX_THREAD_TITLE_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_THREAD_TITLE_LENGTH).trimEnd()}…`;
};

export const getMessageText = (message: {
  role: string;
  content?: unknown;
}): string | null => {
  if (typeof message.content !== "string") {
    return null;
  }

  return message.content.trim() || null;
};

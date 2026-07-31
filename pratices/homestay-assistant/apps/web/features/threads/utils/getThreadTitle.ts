import type { Thread } from "@/features/threads/types";

export const getThreadTitle = (thread: Pick<Thread, "title">): string => {
  const title = thread.title?.trim();
  return title || "New chat";
};

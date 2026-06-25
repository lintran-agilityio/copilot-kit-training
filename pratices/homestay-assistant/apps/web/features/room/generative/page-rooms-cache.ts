import type { findLatestRenderRoomsToolCall } from "../copilot/find-render-rooms-tool-call";

export type PageRoomsToolCall = NonNullable<
  ReturnType<typeof findLatestRenderRoomsToolCall>
>;

const pageRoomsToolCallCache = new Map<string, PageRoomsToolCall>();

export const getPageRoomsToolCall = (loadKey: string) =>
  pageRoomsToolCallCache.get(loadKey);

export const setPageRoomsToolCall = (
  loadKey: string,
  toolCall: PageRoomsToolCall,
) => {
  pageRoomsToolCallCache.set(loadKey, toolCall);
};

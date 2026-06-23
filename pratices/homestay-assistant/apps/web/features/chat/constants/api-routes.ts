import { API_PATHS } from "@/constants";

export const ROUTES = {

};

const withQuery = (path: string, params: Record<string, string>) => {
  const searchParams = new URLSearchParams(params);
  return `${path}?${searchParams.toString()}`;
};

export const API_ROUTES = {
  threads: {
    root: API_PATHS.THREADS,
    list: (agentId: string) => withQuery(API_PATHS.THREADS, { agentId }),
    byId: (threadId: string) => `${API_PATHS.THREADS}/${threadId}`,
    messages: (threadId: string, agentId: string) =>
      withQuery(`${API_PATHS.THREADS}/${threadId}/messages`, { agentId }),
  },
};

import { z } from "zod";

import type { RequestContext } from "@mastra/core/request-context";

import { REQUEST_CONTEXT_KEYS } from "@/mastra/middleware/constants";
import type { MastraAuthContext } from "@/mastra/middleware/types";
import { throwIfAborted } from "@/mastra/utils/abort";

export const getApiUrl = () => process.env.API_URL ?? "http://localhost:5001";

type SearchParams = Record<string, string | number | boolean | undefined>;

export type ApiRequestContext = {
  requestContext?: RequestContext;
  /** Propagated from Mastra tool / agent abortSignal on Stop. */
  abortSignal?: AbortSignal;
};

const getAuthFromContext = (
  requestContext?: RequestContext,
): MastraAuthContext | undefined =>
  requestContext?.get(REQUEST_CONTEXT_KEYS.AUTH) as
    | MastraAuthContext
    | undefined;

const buildAuthHeaders = (requestContext?: RequestContext): HeadersInit => {
  const auth = getAuthFromContext(requestContext);
  const requestId = requestContext?.get(REQUEST_CONTEXT_KEYS.REQUEST_ID);

  const headers: Record<string, string> = {};

  if (auth?.userId) {
    headers["x-user-id"] = auth.userId;
  }

  if (typeof requestId === "string" && requestId.trim()) {
    headers["x-request-id"] = requestId;
  }

  return headers;
};

const buildUrl = (path: string, searchParams?: SearchParams) => {
  const url = new URL(path, getApiUrl());

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url;
};

const parseApiErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as {
      message?: string | string[];
    };

    if (typeof body.message === "string" && body.message.trim()) {
      return body.message;
    }

    if (Array.isArray(body.message) && body.message.length > 0) {
      return body.message.join(", ");
    }
  } catch (error) {
    throw new Error(`Failed to parse API error message: ${error}`);
  }

  return "";
};

const request = async <T>(
  url: URL,
  init: RequestInit,
  schema: z.ZodType<T>,
  errorMessage: string,
  abortSignal?: AbortSignal,
): Promise<T> => {
  throwIfAborted(abortSignal);

  const response = await fetch(url, {
    ...init,
    signal: abortSignal,
  });

  throwIfAborted(abortSignal);

  if (!response.ok) {
    const apiMessage = await parseApiErrorMessage(response);
    const detail = apiMessage || `${errorMessage} (${response.status})`;
    throw new Error(detail);
  }

  const data = await response.json();
  return schema.parse(data);
};

export const get = async <T>(
  path: string,
  schema: z.ZodType<T>,
  options?: {
    searchParams?: SearchParams;
    errorMessage?: string;
  } & ApiRequestContext,
): Promise<T> =>
  request(
    buildUrl(path, options?.searchParams),
    {
      method: "GET",
      headers: buildAuthHeaders(options?.requestContext),
    },
    schema,
    options?.errorMessage ?? `Failed to fetch ${path}`,
    options?.abortSignal,
  );

export const post = async <T>(
  path: string,
  body: unknown,
  schema: z.ZodType<T>,
  errorMessage?: string,
  apiContext?: ApiRequestContext,
): Promise<T> =>
  request(
    buildUrl(path),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...buildAuthHeaders(apiContext?.requestContext),
      },
      body: JSON.stringify(body),
    },
    schema,
    errorMessage ?? `Failed to post ${path}`,
    apiContext?.abortSignal,
  );

export const update = async <T>(
  path: string,
  body: unknown,
  schema: z.ZodType<T>,
  errorMessage?: string,
  apiContext?: ApiRequestContext,
): Promise<T> =>
  request(
    buildUrl(path),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...buildAuthHeaders(apiContext?.requestContext),
      },
      body: JSON.stringify(body),
    },
    schema,
    errorMessage ?? `Failed to update ${path}`,
    apiContext?.abortSignal,
  );

export const del = async <T>(
  path: string,
  schema: z.ZodType<T>,
  errorMessage?: string,
  apiContext?: ApiRequestContext,
): Promise<T> =>
  request(
    buildUrl(path),
    {
      method: "DELETE",
      headers: buildAuthHeaders(apiContext?.requestContext),
    },
    schema,
    errorMessage ?? `Failed to delete ${path}`,
    apiContext?.abortSignal,
  );

import { z } from "zod";

export const getApiUrl = () => process.env.API_URL ?? "http://localhost:5001";

type SearchParams = Record<string, string | number | boolean | undefined>;

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

const request = async <T>(
  url: URL,
  init: RequestInit,
  schema: z.ZodType<T>,
  errorMessage: string,
): Promise<T> => {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`${errorMessage} (${response.status})`);
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
  },
): Promise<T> =>
  request(
    buildUrl(path, options?.searchParams),
    { method: "GET" },
    schema,
    options?.errorMessage ?? `Failed to fetch ${path}`,
  );

export const post = async <T>(
  path: string,
  body: unknown,
  schema: z.ZodType<T>,
  errorMessage?: string,
): Promise<T> =>
  request(
    buildUrl(path),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    schema,
    errorMessage ?? `Failed to post ${path}`,
  );

export const update = async <T>(
  path: string,
  body: unknown,
  schema: z.ZodType<T>,
  errorMessage?: string,
): Promise<T> =>
  request(
    buildUrl(path),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    schema,
    errorMessage ?? `Failed to update ${path}`,
  );

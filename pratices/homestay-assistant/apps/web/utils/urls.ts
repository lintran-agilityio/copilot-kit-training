import { PREFIX_URL } from "@repo/types";

export const getApiUrl = () => process.env.API_URL ?? "http://localhost:5001";
export const WEB_API_BASE = "/api" as const;
export const getBaseUrl = (via: PREFIX_URL) => via === PREFIX_URL.BACKEND ? getApiUrl() : WEB_API_BASE;

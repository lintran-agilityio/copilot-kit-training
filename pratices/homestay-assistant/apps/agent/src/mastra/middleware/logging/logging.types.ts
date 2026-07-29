export type RequestLogContext = {
  requestId?: string;
  method: string;
  path: string;
};

export type ResponseLogContext = RequestLogContext & {
  status: number;
  durationMs: number;
};

export type LoggingConfig = {
  excludePaths?: string[];
};

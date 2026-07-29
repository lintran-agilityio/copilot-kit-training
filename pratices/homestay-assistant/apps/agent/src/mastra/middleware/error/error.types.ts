export type ErrorStatusCode = 401 | 500;

export type MappedErrorResponse = {
  status: ErrorStatusCode;
  body: {
    error: string;
    requestId?: string;
  };
};

export type ErrorMapperInput = {
  error: unknown;
  requestId?: string;
};

import type { ErrorMapperInput, MappedErrorResponse } from "./error.types";

const DEFAULT_ERROR_MESSAGE = "Internal server error";

export const mapErrorToResponse = ({
  error,
  requestId,
}: ErrorMapperInput): MappedErrorResponse => {
  if (error instanceof Error) {
    const status: MappedErrorResponse["status"] =
      error.message.includes("Authentication required") ? 401 : 500;

    return {
      status,
      body: {
        error: status === 500 ? DEFAULT_ERROR_MESSAGE : error.message,
        requestId,
      },
    };
  }

  return {
    status: 500,
    body: {
      error: DEFAULT_ERROR_MESSAGE,
      requestId,
    },
  };
};

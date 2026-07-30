export const CLERK_TOKEN_HEADER = "x-clerk-token";

export const getClerkAuthHeaders = async (
  getToken: () => Promise<string | null>,
): Promise<HeadersInit> => {
  const token = await getToken();

  if (!token) {
    return {};
  }

  return {
    [CLERK_TOKEN_HEADER]: token,
  };
};

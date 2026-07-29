export type MastraAuthContext = {
  userId: string;
  sessionId?: string;
};

export type AuthenticationFailure = {
  status: 401;
  error: string;
};

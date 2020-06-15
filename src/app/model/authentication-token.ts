export interface AuthenticationToken {
  token: string;
  refreshToken: string;
  expiredAt: number;
}

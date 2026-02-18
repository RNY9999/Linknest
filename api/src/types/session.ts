import { AdminStatus } from "./postgres/adminStatus";

// セッション確認APIのレスポンスDTO
export type AdminSessionInfo = {
  valid: true;
  expiresAt: string;
  admin: {
    adminStatus: AdminStatus
    id: number;
    email: string;
    displayName: string;
  };
};

// ログインAPIのリクエストDTO
export type AdminLoginInput = {
  email: string;
  password: string;
  otp?: string;
};

// clientInfoのDTO
export type ClientInfo = {
  ip: string;
  ipChain: string[];
  userAgent: string;
};
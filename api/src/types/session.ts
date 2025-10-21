// セッション確認APIのレスポンスDTO
export type AdminSessionInfo = {
  valid: true;
  expiresAt: string;
  admin: {
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
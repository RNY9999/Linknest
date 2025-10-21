// Redisに保存する内部モデル
export type RawSession = {
  sessionId: string;
  adminId: number;
  email: string;
  displayName: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  expiredAt: string;
};

// セッション用のユーティリティ
export const sessionKey = (sid: string) => `ln:admin:sid:${sid}`;
export const currentSidKey = (adminId: number) => `ln:admin:current_sid:${adminId}`;
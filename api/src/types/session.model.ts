// Redisに保存する内部モデル
export type RawSession = {
  session_id: string;
  admin_id: number;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  expired_at: string;
};

// セッション用のユーティリティ
export const sessionKey = (sid: string) => `ln:admin:sid:${sid}`;
export const currentSidKey = (adminId: number) => `ln:admin:current_sid:${adminId}`;
/**
 * Redis 内に保存する KVS の型定義
 */

// 本登録セッション
export type RedisAdminSession = {
  sessionId: string;
  adminId: string;
  email: string;
  displayName: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  expiredAt: string;
};

// 仮登録セッション
export type RedisAdminTmpSession = RedisAdminSession;

// 単一ログイン用 管理者最新セッション情報 => 現在 string で sessionId のみ保存しているため型不要
// export type RedisAdminCurrentSession = {
//   adminId: string;
//   sessionId: string;
// }

// セッション用のユーティリティ
export const sessionKey = (sid: string) => `ln:admin:sid:${sid}`;
export const tmpSessionKey = (sid: string) => `ln:admin:tmp_sid:${sid}`;
export const currentSidKey = (adminId: string) => `ln:admin:current_sid:${adminId}`;
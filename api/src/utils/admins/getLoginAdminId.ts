import { Cookies } from '@config/constants'
import { UnauthorizedError } from '@errors';
import { getSession } from '@services/redis/sessionService';
import { AdminStatus } from '@types';
import { Request } from 'express'

/**
 * 現在ログイン中の管理者IDを取得する関数
 * 
 * ▼ 処理概要
 * 1. ln_admin_sid, admin_status から セッション内 admin_id を取得
 *    ※ln_admin_sid, admin_status の有効性はミドルウェアで検証済みの前提
 * 
 * @return bigint
 */

export const getLoginAdminId = async (req: Request): Promise<bigint> => {
  const sid = req.cookies?.[Cookies.COOKIE_NAME_ADMIN_SESSION];
  const adminStatus = Number(req.cookies?.[Cookies.COOKIE_NAME_ADMIN_STATUS]) as AdminStatus;

  const session = await getSession(sid, adminStatus);
  if (!session || !session.adminId) throw new UnauthorizedError();

  const loginAdminId = BigInt(session.adminId);

  return loginAdminId;
}
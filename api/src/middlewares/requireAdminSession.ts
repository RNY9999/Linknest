import { Cookies } from '@config/constants';
import { UnauthorizedError } from '@errors';
import { verifySession } from '@services/redis/sessionService';
import { Request, Response, NextFunction } from 'express';

/**
 * セッション検証ミドルウェア
 * 
 * ▼ 処理概要
 * 1. request 内 の Cookie から, ln_admin_sid, status_id を取得する
 * └取得できない場合は 401 / UNAUTHORIZED
 * 2. ln_admin_sid, status_id を用いた セッション検証
 * └検証結果が false の場合は 401 / UNAUTHORIZED
 * 3. 検証成功した場合, next() を行う
 * @param req - HTTP リクエストオブジェクト
 * @param _res - HTTP レスポンスオブジェクト
 * @param next - NextFunction
 */
const verifySessionMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  // 1. request 内 の Cookie から, ln_admin_id, status_id を取得する
  const sid = req.cookies?.[Cookies.COOKIE_NAME_ADMIN_SESSION];
  const adminStatus = req.cookies?.[Cookies.COOKIE_NAME_ADMIN_STATUS];

  if (!sid || !adminStatus) throw new UnauthorizedError();

  // 2. ln_admin_id, status_id を用いた セッション検証
  const verifySessionResult = await verifySession(sid, adminStatus);

  if (!verifySessionResult) throw new UnauthorizedError();

  // 3. 検証成功した場合, next() を行う
  next();
}

export default verifySessionMiddleware;
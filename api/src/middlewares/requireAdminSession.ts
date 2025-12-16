import { Cookies } from '@config/constants';
import { Request, Response, NextFunction } from 'express';

/**
 * セッション検証ミドルウェア
 * 
 * ▼ 処理概要
 * 1. request 内 の Cookie から, ln_admin_id, status_id を取得する
 * └取得できない場合は 401 / UNAUTHORIZED
 * 2. ln_admin_id, status_id を用いた セッション検証
 * └検証結果が false の場合は 401 / UNAUTHORIZED
 * 3. 検証成功した場合, next() を行う
 * @param req 
 * @param _res 
 * @param next 
 */
const verifySessionMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  // const sid: string = req.cookies?.[Cookies.COOKIE_NAME_ADMIN_SESSION];
  //   const adminStatus: AdminStatus = req.cookies?.[Cookies.COOKIE_NAME_ADMIN_STATUS];
  
  //   if (!sid || !adminStatus) {
  //     throw new UnauthorizedError();
  //   }
  const sid = req.cookies?.[Cookies.COOKIE_NAME_ADMIN_SESSION];
  const adminStatus = req.cookies?.[Cookies.COOKIE_NAME_ADMIN_STATUS];

  
}
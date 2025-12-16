import { Cookies } from '@config/constants';
import { UnauthorizedError } from '@errors';
import { getSession } from '@services/redis/sessionService';
import { Request, Response } from 'express';

/**
 * OTP送信API
 * 
 * ▼ 処理概要
 * 1. ln_admin_sid, admin_status から セッション内 email を取得
 * ※ln_admin_sid, admin_status の有効性はミドルウェアで検証済みの前提
 * 2. OTP を生成（DBにはハッシュ化して保存）
 * 3. OTP をセッションから取得した email に送信
 * 4. セッション, CSRFトークン をローリングして 200 / OK を返却
 * @param req 
 * @param res 
 */
export const postOtp = async (req: Request, res: Response) => {
  // 1. ln_admin_sid, admin_status から セッション内 email を取得
  const sid = req.cookies?.[Cookies.COOKIE_NAME_ADMIN_SESSION];
  const adminStatus = req.cookies?.[Cookies.COOKIE_NAME_ADMIN_STATUS];

  const session = await getSession(sid, adminStatus);

  if (!session || session.email) throw new UnauthorizedError();

  const email = session.email;
}
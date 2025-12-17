import { AdminStatuses, Cookies, NextPaths, ResponseStatus } from '@config/constants';
import { InternalServerError, UnauthorizedError } from '@errors';
import { IS_DEV } from '@lib/env';
import { buildSuccessResponse } from '@lib/response/buildResponse';
import { createAdminOtp, getAdminByAdminId } from '@services/postgres/admins.service';
import { createCsrf } from '@services/redis/csrfService';
import { createSession, getSession } from '@services/redis/sessionService';
import { AdminStatus } from '@types';
import { setAdminSidCookie, setAdminStatusCookie } from '@utils/cookie/setCookie';
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
  const adminStatus = Number(req.cookies?.[Cookies.COOKIE_NAME_ADMIN_STATUS]) as AdminStatus;

  if (!sid || Number.isNaN(adminStatus)) throw new UnauthorizedError();

  const session = await getSession(sid, adminStatus);

  if (!session || !session.adminId || !session.email || !session.displayName) throw new UnauthorizedError();

  const adminId: number = Number(session.adminId);
  const email = session.email;
  const displayName: string = session.displayName;

  // 2. OTP を生成（DBにはハッシュ化して保存）
  const adminOtp = await createAdminOtp(adminId);


  // 4. セッション, CSRFトークン をローリングして 200 / OK を返却

  // ln_admin_sid の発行とセット
  const newSid: string = await createSession(req, adminId, adminStatus, email, displayName);
  setAdminSidCookie(res, newSid, adminStatus);

  // admin_status のセット
  setAdminStatusCookie(res, adminStatus);

  // CSRFトークンの生成
  const csrfToken: string = await createCsrf(newSid, adminStatus);

  // response用のdata, metaの生成
  const admin = await getAdminByAdminId(adminId);
  if (!admin?.otpExpiredAt) throw new InternalServerError();

  const data = {
    nextPath: NextPaths.OTP_VERIFY,
    otpDeliveryAddress: email,
    expiresAt: admin?.otpExpiredAt.toISOString()
  }

  const meta = {
    csrfToken: csrfToken
  }

  // 3. OTP をセッションから取得した email に送信
  // [注意] return の直前でメールを送ることで、メールは送られたけど、サーバーエラーという状況をなくしています。
  // TODO: mail 送信処理に関しては後から実装
  // ※2025/12/17時点で未実装 / sendOtpMail(adminOtp, email)関数を想定

  if (IS_DEV) {
    console.log(`[OTP] requestId       : ${(req as any)?.requestId || '不明'}`);
    console.log(`[OTP] requestTimestamp: ${(req as any)?.requestTimestamp || '不明'}`);
    console.log(`[OTP] OTP             : ${adminOtp || '不明'}`);
  }

  return buildSuccessResponse(
    req,
    res,
    ResponseStatus.OK,
    data,
    meta,
    "OTP送信完了"
  );
}
import { AdminStatuses, Cookies, NextPaths, OTP_MAX_FAIL, ResponseStatus } from '@config/constants';
import { InternalServerError, MaxRequestError, UnauthorizedError } from '@errors';
import { IS_DEV } from '@lib/env';
import { buildSuccessResponse } from '@lib/response/buildResponse';
import { AdminOtpSchema } from '@schemas/adminOtp.schema';
import { createAdminOtp, getAdminByAdminId, updateAdminOtpByAdminId, updateAdminStatusIdByAdminId, verifyAdminOtp } from '@services/postgres/admins.service';
import { createCsrf } from '@services/redis/csrfService';
import { createSession, getSession } from '@services/redis/sessionService';
import { AdminStatus, UpdateAdminOtp } from '@types';
import { setAdminSidCookie, setAdminStatusCookie } from '@utils/cookie/setCookie';
import { Request, Response } from 'express';

/**
 * OTP有効期限確認API
 * 管理者OTP有効期限を確認するAPI
 * 現状だと、OTPの有効期限が過ぎていても返却するが、今後有効期限が過ぎている場合の扱いについて検討するかも（2026/2/2）
 * 
 * ▼ 処理概要
 * 1. ln_admin_sid, admin_status から セッション内 admin_id を取得
 * ※ln_admin_sid, admin_status の有効性はミドルウェアで検証済みの前庭
 * 2. admin_id から admins テーブルを検索し、ワンタイムパスワード有効期限を取得
 * ※取得できない（null）の場合は 401 / Unauthorized を返却
 * 3. 取得したワンタイムパスワード有効期限を返却
 * @param req 
 * @param res 
 */
export const getOtp = async (req: Request, res: Response) => {
  // 1. ln_admin_sid, admin_status から セッション内 admin_id を取得
  const sid = req.cookies?.[Cookies.COOKIE_NAME_ADMIN_SESSION];
  const adminStatus = Number(req.cookies?.[Cookies.COOKIE_NAME_ADMIN_STATUS]) as AdminStatus;

  // Number.isNaN() : 引数を型変換せずに NaN かどうかを判断する
  // isNaN() : 引数を Number へ型変換してから NaN かどうかを判断する
  // adminStatus はすでに Number 型へキャストされているので Number.isNaN を使用
  if (!sid || Number.isNaN(adminStatus)) throw new UnauthorizedError();

  const session = await getSession(sid, adminStatus);
  if (!session || !session.adminId) throw new UnauthorizedError();

  // 2. admin_id から admins テーブルを検索し、ワンタイムパスワード有効期限を取得
  const adminId: number = Number(session.adminId);

  const adminData = await getAdminByAdminId(adminId);
  if (!adminData?.otpExpiredAt) throw new UnauthorizedError();

  // 3. 取得したワンタイムパスワード有効期限を返却
  const resData = {
    expiresAt: adminData.otpExpiredAt
  };
  const resMessage = "OTP有効期限取得完了";

  return buildSuccessResponse(req, res, ResponseStatus.OK, resData, {}, resMessage);
};

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

/**
 * OTP検証API
 * 
 * ▼ 処理概要
 * 1. ln_admin_sid, admin_status から セッション内 adminId を取得
 * 2. 送られてきた OTP と adminId を用いてOTPを検証
 * 3. OTP認証に失敗した場合, 401 / OTP_UNAUTHORIZED
 * └5回以上失敗の場合は 423 / MAX_REQUEST
 * 4. OTP認証に成功した場合, statusId = 3 (本登録), ln_admin_sid, admin_status, csrf token の再発行
 * └その際、DBの OTP 関連のカラムは初期化する
 */
export const patchOtp = async (req: Request, res: Response) => {
  // 1. ln_admin_sid, admin_status から セッション内 adminId を取得
  const sid = req.cookies?.[Cookies.COOKIE_NAME_ADMIN_SESSION];
  const statusId = Number(req.cookies?.[Cookies.COOKIE_NAME_ADMIN_STATUS]) as AdminStatus;
  if (!sid || Number.isNaN(statusId)) throw new UnauthorizedError();

  const adminSession = await getSession(sid, statusId);
  if (!adminSession || !adminSession.adminId) throw new UnauthorizedError();

  const adminId = Number(adminSession.adminId);

  // 2. 送られてきた OTP と adminId を用いてOTPを検証
  const receivedAdminOtp = ((req as any).validated as AdminOtpSchema).otp;
  const otpVerifyResult: boolean = await verifyAdminOtp(receivedAdminOtp, adminId);

  // 3. OTP認証に失敗した場合, 401 / OTP_UNAUTHORIZED
  // └5回以上失敗の場合は 423 / MAX_REQUEST
  const admin = await getAdminByAdminId(adminId);
  if (!admin || admin?.otpFailureCount == null) throw new InternalServerError();

  const otpFailureCount = admin.otpFailureCount;

  if (!otpVerifyResult) {
    if (otpFailureCount >= OTP_MAX_FAIL) {
      throw new MaxRequestError(
        {},
        "ワンタイムパスワード入力制限に達しました。\n\nこのメールアドレスでのアカウント登録は48時間できません。\n\n48時間経過後に再度ご登録お願いします。",
      );
    }

    // response details の作成
    const details = {
      failedCount: otpFailureCount,
      maxAttempts: OTP_MAX_FAIL
    }

    throw new UnauthorizedError(
      "入力内容に誤りがあります。\n\n合計{maxAttempts}回間違えると48時間の間、\nこのメールアドレスでのアカウント登録が無効となります。\n\n回答誤り : 「{failedCount}」回目",
      details,
      ResponseStatus.UNAUTHORIZED,
      "OTP_UNAUTHORIZED"
    )
  }

  // 4. OTP認証に成功した場合, statusId = 3 (本登録), ln_admin_sid, admin_status, csrf token の再発行
  
  // admin_statusを新たに 3 （本登録にする）
  const newStatusId = AdminStatuses.REGISTER;
  setAdminStatusCookie(res, newStatusId);
  
  // ln_admin_sid の再発行
  if (!adminSession.email || !adminSession.displayName) throw new InternalServerError();
  
  const email = adminSession.email;
  const displayName = adminSession.displayName;
  
  const newSid = await createSession(req, adminId, newStatusId, email, displayName);
  setAdminSidCookie(res, newSid, newStatusId);
  
  // csrf token の再発行
  const newCsrfToken = await createCsrf(newSid, newStatusId);
  
  // DBの OTP 関連のカラムは初期化する
  const resetData: UpdateAdminOtp = {
    otpCode: null,
    otpExpiredAt: null,
    otpFailureCount: 0
  };
  
  // OTP関連のアップデートとステータスのアップデートはずれないようにまとめてやる
  await Promise.all([
    updateAdminOtpByAdminId(resetData, adminId), // OTP関連のデータのリセット
    updateAdminStatusIdByAdminId(newStatusId, adminId) // ステータスの更新
  ])

  // response 用のデータの組み立て
  const data = {
    nextPath: NextPaths.OTP_COMPLETED,
    admin: {
      id: adminId,
      email: email,
      displayName: displayName
    }
  }

  const meta = {
    csrfToken: newCsrfToken
  }

  return buildSuccessResponse(
    req, 
    res, 
    ResponseStatus.OK, 
    data, 
    meta, 
    "OTP認証に成功しました"
  );
}
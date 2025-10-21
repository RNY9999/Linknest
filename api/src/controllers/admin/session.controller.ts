import { Request, Response } from "express";
import { ErrorResponseMappings, Cookies } from "../../config/constants";
import { SuccessCode, ErrorCode, ApiErrorCode, sessionKey, RawSession, AdminSessionInfo } from "@types";
import { ensureRedis, redis } from "@lib/redis";
import { verifySession } from "@services/redis/sessionService";

/**
 * API仕様
 * Cookieのln_admin_sidを検証し、セッションの有効性を返す。
 * 原則としてSet-Cookieを返さない
 *
 * 流れとしては、ln_admin_sidからRedis内に一致するln_admin_sidを検索
 * 一致するもので有効なものがあれば、セッションを有効として返す。
 */
export const getAdminSession = async (req: Request, res: Response) => {
  try {
    await ensureRedis();
    const isTest = false;
    if (isTest) {
      const demoData: RawSession = {
        sessionId: "asdf1234",
        adminId: 99,
        email: "example@sample.com",
        displayName: "demo1",
        ipAddress: "192.168.1.1",
        userAgent: "Firefox",
        createdAt: "2025/10/10",
        expiredAt: "2025/10/31"
      }
      await redis.set("ln:admin:sid:asdf1234", JSON.stringify(demoData));
    }
    console.log("リクエストあり");
    let status: SuccessCode | ErrorCode = 200;
    let errorCode: ApiErrorCode = "BAD_REQUEST"; // 明示的に"BAD_REQUEST"にしているが用途に合わせて変更

    // 1) adminセッションを取得するためのCookieの属性を取得 / 取得できない場合は、サーバーエラーを返す
    const COOKIE_NAME_ADMIN_SESSION: string | undefined = Cookies.COOKIE_NAME_ADMIN_SESSION;
    if (!COOKIE_NAME_ADMIN_SESSION) {
      status = 500;
      errorCode = "INTERNAL_SERVER_ERROR";
      return returnErrorResponse(res, status, ErrorResponseMappings[status][errorCode]);
    }

    // 2) Cookieから ln_admin_sid を取り出す / 取得できない場合は401エラーを返す
    const sid: string = req.cookies?.["ln_admin_sid"];
    if (!sid) {
      status = 401;
      errorCode = "UNAUTHORIZED";
      return returnErrorResponse(res, status, ErrorResponseMappings[status][errorCode]);
    }

    console.log(sid);

    // 3) sidをkeyとしてKVSを検索 / 取得できない場合は401エラーを返す
    
    const rawOfJson: string | null = await redis.get(sessionKey(sid));
    const data: Promise<{verifyResult: boolean; resData?: AdminSessionInfo} | undefined> = verifySession(sid);

    if (!data || data["verifyResult"]) { // redisからデータが取得できない場合 または data.verifyResultがfalseの場合
      status = 401;
      errorCode = "UNAUTHORIZED";
      return returnErrorResponse(res, status, ErrorResponseMappings[status][errorCode]);
    }

    // 4) 有効なセッションがある場合は200 / そうでない場合は401を返す
    const raw: RawSession = JSON.parse(rawOfJson);
    const now: number = Date.now();
    const expiredAt: number = new Date(raw.expiredAt).getTime();
    const valid: boolean = Number.isFinite(expiredAt) && expiredAt > now;
    const adminId: number | undefined = raw.adminId ?? undefined;
    const email: string | undefined = raw.email ?? undefined;
    const displayName: string | undefined = raw.displayName ?? undefined;

    if (!valid || !adminId || !email) {
      status = 401;
      errorCode = "UNAUTHORIZED";
      return returnErrorResponse(res, status, ErrorResponseMappings[status][errorCode]);
    }

    const resData: AdminSessionInfo = {
      valid: true,
      expiresAt: String(expiredAt),
      admin: {
        id: adminId,
        email: email,
        displayName: displayName
      }

    }
    return returnSuccessResponse(res, status, resData);
  } catch (error) {
    console.log(error);
  }
};

const returnErrorResponse = (res: Response, status: number, errorResponseMapping: object) => {
  res.set("Cache-Control", "no-store");
  res.status(status).json(errorResponseMapping);

  return res;
}

const returnSuccessResponse = <Data>(res: Response, status: SuccessCode, responseData: Data) => {
  res.set("Cache-Control", "no-store");
  res.status(status).json(responseData);

  return res;
}

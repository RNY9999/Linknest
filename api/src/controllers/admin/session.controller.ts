import { Request, Response } from "express";
import { ErrorResponseMappings, Cookies } from "../../config/constants";
import { SuccessCode, ErrorCode, ApiErrorCode, RawSession, AdminSessionInfo, AdminLoginInput } from "@types";
import { redis } from "@lib/redis";
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

    // 3) sidをkeyとしてKVSを検索: 有効なセッションがある場合は200 / そうでない場合は401を返す
    const data: {verifyResult: boolean; resData?: AdminSessionInfo} | undefined = await verifySession(sid);
    
    if (!data?.["verifyResult"]) { // redisからデータが取得できない場合 または data.verifyResultがfalseの場合
      status = 401;
      errorCode = "UNAUTHORIZED";
      return returnErrorResponse(res, status, ErrorResponseMappings[status][errorCode]);
    }

    console.log(data["verifyResult"]);

    return returnSuccessResponse(res, status, data.resData);
  } catch (error) {
    console.log(error);
  }
};

/**
 * API仕様（ざっくり）
 * 1. req.bodyからメールアドレス / パスワードの取得
 * 2. DBから対応するレコードの取得
 * 3. ログイン成功 / 失敗 / 初回ログインのどれかを伝える
 * 
 */
export const postAdminSEssion = async (req: Request, res: Response) => {
  console.log("post req!");
  let status: number = 200;
  
  // request bodyの取り出し
  const reqBody: AdminLoginInput = JSON.parse(req.body);
  const email: string = reqBody?.email;
  const password: string = reqBody?.password;

  return res.status(200).json({"hi": "hi"});
}

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

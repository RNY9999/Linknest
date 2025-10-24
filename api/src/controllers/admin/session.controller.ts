import { Request, Response } from "express";
import { ErrorResponseMappings, Cookies } from "../../config/constants";
import { SuccessStatus, ErrorStatus, ErrorCode, RawSession, AdminSessionInfo, AdminLoginInput } from "@types";
import { redis } from "@lib/redis";
import { verifySession } from "@services/redis/sessionService";
import { idPasswordVerify, createAdmin } from "@services/postgres/adminService";

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
    let status: SuccessStatus | ErrorStatus = 200;
    let ErrorStatus: ErrorCode = "BAD_REQUEST"; // 明示的に"BAD_REQUEST"にしているが用途に合わせて変更

    // 1) adminセッションを取得するためのCookieの属性を取得 / 取得できない場合は、サーバーエラーを返す
    const COOKIE_NAME_ADMIN_SESSION: string | undefined = Cookies.COOKIE_NAME_ADMIN_SESSION;
    if (!COOKIE_NAME_ADMIN_SESSION) {
      status = 500;
      ErrorStatus = "INTERNAL_SERVER_ERROR";
      return returnErrorResponse(res, status, ErrorResponseMappings[status][ErrorStatus]);
    }

    // 2) Cookieから ln_admin_sid を取り出す / 取得できない場合は401エラーを返す
    const sid: string = req.cookies?.["ln_admin_sid"];
    if (!sid) {
      status = 401;
      ErrorStatus = "UNAUTHORIZED";
      return returnErrorResponse(res, status, ErrorResponseMappings[status][ErrorStatus]);
    }

    console.log(sid);

    // 3) sidをkeyとしてKVSを検索: 有効なセッションがある場合は200 / そうでない場合は401を返す
    const data: {verifyResult: boolean; resData?: AdminSessionInfo} | undefined = await verifySession(sid);
    
    if (!data?.["verifyResult"]) { // redisからデータが取得できない場合 または data.verifyResultがfalseの場合
      status = 401;
      ErrorStatus = "UNAUTHORIZED";
      return returnErrorResponse(res, status, ErrorResponseMappings[status][ErrorStatus]);
    }

    console.log(data["verifyResult"]);

    return returnSuccessResponse(res, status, data.resData);
  } catch (error) {
    console.log(error);
  }
};

/**
 * API仕様（ざっくり）
 * 
 * 1. req.bodyからメールアドレス / パスワードの取得
 * => バリデーションチェック
 * => バリデーションエラーの場合は 400 / BAD_REQUEST
 * 
 * 2. DBから対応するレコードの取得
 * => 取得できない場合は 401 / UNAUTHORIZED
 * => 取得時はstatusIdの取得が必須
 *  => statusId: 1. 仮登録           ... 次の処理に進む（いったん202）
 *  => statusId: 2. 仮登録_ロック     ... 423 / MAX_REQUEST
 *  => statusId: 3. 本登録            ... 次の処理に進む（いったん200）
 *  => statusId: 4. 本登録_ロック      ... 423 / MAX_REQUEST
 *  => statusId: 5. 本登録_退職済み     ... おそらく要件内で未検討 => いったん401 / UNAUTHORIZEDにしとく？
 * 
 * 3. Session / CSRF token の発行
 * Session ID / CSRF token の発行を行う
 * => 発行完了: 200 or 202 
 * => 発行失敗（Session ID）: 500 / LN_ADMIN_SID_ISSUANCE_FAILED
 * => 発行失敗（CSRF token）: 500 / CSRF_ISSUANCE_FAILED
 *
 * ※API処理内でその他サーバエラーが発生した場合は 500 / INTERNAL_SERVER_ERROR
 */
export const postAdminSession = async (req: Request, res: Response) => {
  console.log("post req!");
  let status: SuccessStatus | ErrorStatus = 200;
  let ErrorStatus: ErrorCode = "BAD_REQUEST";
  
  // request bodyの取り出し
  // const reqBody: AdminLoginInput = JSON.parse(req.body);
  const email: string = req?.body?.email;
  const password: string = req?.body?.password;

  /**
   * テストアカウントの登録処理
   * 後々消すからここはレビューなどはしなくてよし
   */
  const isTest = false;
  if (isTest) {
    console.log("test start");
    if (!email || !password) {
      status = 500;
      ErrorStatus = "INTERNAL_SERVER_ERROR";
      returnErrorResponse(res, status, ErrorResponseMappings[status][ErrorStatus]);
    }
    try {
      console.log("createAdmin");
      const createAdminResult: boolean = await createAdmin(email, password);
      if (createAdminResult) {
        status = 200;
        return returnSuccessResponse(res, status, {"userCreate": "success"});
      }
    } catch (error) {
      console.log(error);
    }
  }

  return res.status(200).json({"hi": "hi"});
}

const returnErrorResponse = (res: Response, status: number, errorResponseMapping: object) => {
  res.set("Cache-Control", "no-store");
  res.status(status).json(errorResponseMapping);

  return res;
}

const returnSuccessResponse = <Data>(res: Response, status: SuccessStatus, responseData: Data) => {
  res.set("Cache-Control", "no-store");
  res.status(status).json(responseData);

  return res;
}

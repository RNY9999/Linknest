import { Request, Response } from "express";
import { ErrorResponseMappings, Cookies, ResponseStatus, NextPaths } from "@config/constants";
import { SuccessStatus, ErrorStatus, ErrorCode, RawSession, AdminSessionInfo, AdminLoginInput, ApiSuccess } from "@types";
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
    let status: SuccessStatus | ErrorStatus = ResponseStatus.BAD_REQUEST;
    let errorCode: ErrorCode = "BAD_REQUEST"; // 明示的に"BAD_REQUEST"にしているが用途に合わせて変更

    // 1) adminセッションを取得するためのCookieの属性を取得 / 取得できない場合は、サーバーエラーを返す
    const COOKIE_NAME_ADMIN_SESSION: string | undefined = Cookies.COOKIE_NAME_ADMIN_SESSION;
    if (!COOKIE_NAME_ADMIN_SESSION) {
      status = ResponseStatus.INTERNAL_SERVER_ERROR;
      errorCode = "INTERNAL_SERVER_ERROR";
      return returnErrorResponse(res, status, ErrorResponseMappings[status][errorCode]);
    }

    // 2) Cookieから ln_admin_sid を取り出す / 取得できない場合は401エラーを返す
    const sid: string = req.cookies?.["ln_admin_sid"];
    if (!sid) {
      status = ResponseStatus.UNAUTHORIZED;
      errorCode = "UNAUTHORIZED";
      return returnErrorResponse(res, status, ErrorResponseMappings[status][errorCode]);
    }

    console.log(sid);

    // 3) sidをkeyとしてKVSを検索: 有効なセッションがある場合は200 / そうでない場合は401を返す
    const data: { verifyResult: boolean; resData?: AdminSessionInfo } | undefined = await verifySession(sid);

    if (!data?.["verifyResult"] || !data.resData) { // redisからデータが取得できない場合 または data.verifyResultがfalseの場合
      status = ResponseStatus.UNAUTHORIZED;
      errorCode = "UNAUTHORIZED";
      return returnErrorResponse(res, status, ErrorResponseMappings[status][errorCode]);
    }

    console.log(data["verifyResult"]);

    status = ResponseStatus.OK;
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
 * => => 取得時はstatusIdにより, Response内容が変わる
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
  let status: SuccessStatus | ErrorStatus = ResponseStatus.BAD_REQUEST
  let errorCode: ErrorCode = "BAD_REQUEST";

  try {
    /**
     * 1. req.bodyからメールアドレス / パスワードの取得
     * => バリデーションチェック
     * => バリデーションエラーの場合は 400 / BAD_REQUEST
     */
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
        status = ResponseStatus.INTERNAL_SERVER_ERROR
        errorCode = "INTERNAL_SERVER_ERROR";
        returnErrorResponse(res, status, ErrorResponseMappings[status][errorCode]);
      }
      try {
        console.log("createAdmin");
        const createAdminResult: boolean = await createAdmin(email, password);
        if (createAdminResult) {
          status = ResponseStatus.OK
          return returnSuccessResponse(res, status, { "userCreate": "success" });
        }
      } catch (error) {
        console.log(error);
      }
    }
    console.log("[post] api/admin/session");

    console.log("[post] ========== req.body ==========");
    console.log(`[post] req.body.email: ${req.body.email}`);
    console.log(`[post] req.body.password: ${req.body.password}`);
    // mail / passwordの存在確認
    if (!email || !password) {
      status = ResponseStatus.BAD_REQUEST
      errorCode = "BAD_REQUEST";
      return returnErrorResponse(res, status, ErrorResponseMappings[status][errorCode]);
    }

    // バリデーションチェック
    const isValid: boolean = true; // TODO: バリデーションチェック用の関数で後々は判定
    if (!isValid) {
      status = ResponseStatus.BAD_REQUEST
      errorCode = "BAD_REQUEST";
      return returnErrorResponse(res, status, ErrorResponseMappings[status][errorCode]);
    }

    /**
     * 2. DBから対応するレコードの取得
     * => 取得できない場合は 401 / UNAUTHORIZED
     * => 取得時はstatusIdにより, Response内容が変わる
     *  => statusId: 1. 仮登録           ... 次の処理に進む（いったん202）
     *  => statusId: 2. 仮登録_ロック     ... 423 / MAX_REQUEST
     *  => statusId: 3. 本登録            ... 次の処理に進む（いったん200）
     *  => statusId: 4. 本登録_ロック      ... 423 / MAX_REQUEST
     *  => statusId: 5. 本登録_退職済み     ... おそらく要件内で未検討 => いったん401 / UNAUTHORIZEDにしとく？
     */
    const idPasswordVerifyResult: { isVerify: boolean, success?: { successStatus: SuccessStatus, nextPath: string, adminInfo: { adminId: string, email: string, displayName: string } }, error?: { errorStatus: ErrorStatus } } = await idPasswordVerify(email, password);

    // idPasswordVerifyResult.isVerifyによって処理を分ける
    // TODO 各case内でreturnしないと、statusとerrorCodeがそれぞれ独立したユニオンとなり、あとからまとめてreturnすると型エラーになる、後々、あとからまとめてreturnできるように改善したい
    if (!idPasswordVerifyResult.isVerify) {
      console.log("[post] ========== is not verified ==========");
      switch (idPasswordVerifyResult.error?.errorStatus) {
        case ResponseStatus.UNAUTHORIZED:
          status = idPasswordVerifyResult.error.errorStatus;
          errorCode = "UNAUTHORIZED";
          return returnErrorResponse(res, status, ErrorResponseMappings[status][errorCode])
        case ResponseStatus.LOCKED:
          status = idPasswordVerifyResult.error.errorStatus;
          errorCode = "MAX_REQUEST";
          return returnErrorResponse(res, status, ErrorResponseMappings[status][errorCode])
        default:
          status = ResponseStatus.UNAUTHORIZED;
          errorCode = "UNAUTHORIZED";
          return returnErrorResponse(res, status, ErrorResponseMappings[status][errorCode])
      }
    }

    /**
    * 3. Session / CSRF token の発行
    * Session ID / CSRF token の発行を行う
    * => 発行完了: 200 or 202 
    * => 発行失敗（Session ID）: 500 / LN_ADMIN_SID_ISSUANCE_FAILED
    * => 発行失敗（CSRF token）: 500 / CSRF_ISSUANCE_FAILED
     */
    console.log("[post] ========== is verified ==========");
    // ID / Password 検証の結果データが正常に取得できているか確認
    if (
      !idPasswordVerifyResult.success?.successStatus ||  // ステータスの確認
      !idPasswordVerifyResult.success?.nextPath ||  // nextPathの確認
      !idPasswordVerifyResult.success?.adminInfo.adminId ||  // adminIdの確認
      !idPasswordVerifyResult.success?.adminInfo.email ||  // emailの確認
      !idPasswordVerifyResult.success?.adminInfo.displayName  // displayNameの確認
    ) {
      console.log("[post] パラメータ不足");
      console.log(`[post] status     : ${idPasswordVerifyResult.success?.successStatus}`);
      console.log(`[post] nextPath   : ${idPasswordVerifyResult.success?.nextPath}`);
      console.log(`[post] adminId    : ${idPasswordVerifyResult.success?.adminInfo.adminId}`);
      console.log(`[post] email      : ${idPasswordVerifyResult.success?.adminInfo.email}`);
      console.log(`[post] displayName: ${idPasswordVerifyResult.success?.adminInfo.displayName}`);
      status = ResponseStatus.UNAUTHORIZED;
      errorCode = "UNAUTHORIZED";
      return returnErrorResponse(res, status, ErrorResponseMappings[status][errorCode]);
    }

    // TODO: Session IDの発行処理
    const sid: string = "testSid";
    if (!sid) {
      status = ResponseStatus.INTERNAL_SERVER_ERROR;
      errorCode = "LN_ADMIN_SID_ISSUANCE_FAILED";
      return returnErrorResponse(res, status, ErrorResponseMappings[status][errorCode]);
    }
    // TODO: CSRF tokenの発行処理
    const csrf: string = "testCsrf";
    if (!csrf) {
      status = ResponseStatus.INTERNAL_SERVER_ERROR;
      errorCode = "CSRF_ISSUANCE_FAILED";
      return returnErrorResponse(res, status, ErrorResponseMappings[status][errorCode]);
    }

    // resDataの組み立て
    status = idPasswordVerifyResult.success.successStatus;

    const resNextPath = idPasswordVerifyResult.success.nextPath;
    const resAdminId = idPasswordVerifyResult.success.adminInfo.adminId;
    const resEmail = idPasswordVerifyResult.success.adminInfo.email;
    const resDisplayName = idPasswordVerifyResult.success.adminInfo.displayName;

    let resData = {};

    switch (status) {
      case ResponseStatus.OK:
        resData = {
          nextPath: resNextPath,
          admin: {
            adminId: resAdminId,
            email: resEmail,
            displayName: resDisplayName
          }
        }
        break;
      case ResponseStatus.ACCEPTED:
        resData = {
          nextPath: resNextPath,
          otpDeliveryAddress: resEmail
        }
        break;
      default:
        status = ResponseStatus.UNAUTHORIZED;
        errorCode = "UNAUTHORIZED";
        return returnErrorResponse(res, status, ErrorResponseMappings[status][errorCode]);
    };

    return returnSuccessResponse(res, status, resData);
  } catch (error) {
    console.log(`[post error]api/admin/session: ${error}`);

    status = ResponseStatus.INTERNAL_SERVER_ERROR;
    errorCode = "INTERNAL_SERVER_ERROR";
    return returnErrorResponse(res, status, ErrorResponseMappings[status][errorCode]);
  }

}

const returnErrorResponse = (res: Response, status: number, errorResponseMapping: object) => {
  res.set("Cache-Control", "no-store");
  res.status(status).json(errorResponseMapping);

  return res;
}

const returnSuccessResponse = <Data>(res: Response, status: SuccessStatus, data: Data) => {
  const resData: ApiSuccess<Data> = {
    api: "ok",
    data: data,
  }

  res.set("Cache-Control", "no-store");
  res.status(status).json(resData);

  return res;
}

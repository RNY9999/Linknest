import { Request, Response } from "express";
import { Cookies, requestHeaders, ResponseStatus } from "@config/constants";
import { SuccessStatus, ErrorStatus, AdminStatus } from "@types";
import { createSession, deleteSession, getSession, verifySession, verifySessionOld } from "@services/redis/sessionService";
import { idPasswordVerify } from "@services/postgres/admins.service";
import { AdminSessionInput } from "@schemas/adminSession.schema";
import { createCsrf, deleteCsrf, verifyCsrf } from "@services/redis/csrfService";
import { buildSuccessResponse } from "@lib/response/buildResponse";
import { deleteAdminSidCookie, deleteAdminStatusCookie, setAdminSidCookie, setAdminStatusCookie } from "@utils/cookie/setCookie";
import { BadRequestError, CsrfIssuanceFailedError, ForbiddenError, InternalServerError, LnAdminSidIssuanceFailedError, MaxRequestError, UnauthorizedError } from "@errors";

/**
 * 管理者ログインチェックAPI
 * Cookieのln_admin_sidを検証し、セッションの有効性を返す。
 * 原則としてSet-Cookieを返さない
 * 
 * ▼ 処理概要
 *
 * 1. cookies から sid, adminStatusを取得する
 * ※取得できない場合は UnauthorizedError 
 * 2. verifySession関数でセッションの有効性をチェックし有効な場合は次の処理へ
 * ※無効なセッションの場合は UnauthorizedError
 * 3. getSession関数でセッションの内容を取得し、resData を生成して Response を生成
 */
export const getAdminSession = async (req: Request, res: Response) => {
  // 1. cookies から sid, adminStatusを取得する
  // ※取得できない場合は UnauthorizedError 
  const sid: string = req.cookies?.[Cookies.COOKIE_NAME_ADMIN_SESSION];
  const adminStatus: AdminStatus = req.cookies?.[Cookies.COOKIE_NAME_ADMIN_STATUS];

  if (!sid || !adminStatus) {
    throw new UnauthorizedError();
  }

  // 2. verifySession関数でセッションの有効性をチェックし有効な場合は次の処理へ
  // ※無効なセッションの場合は UnauthorizedError
  const verifySessionResult: boolean = await verifySession(sid, adminStatus);
  if (!verifySessionResult) return new UnauthorizedError();

  // 3. getSession関数でセッションの内容を取得し、resData を生成して Response を生成
  const session = await getSession(sid, adminStatus);
  if (!session || !session.adminId || !session.email || !session.displayName) {
    return new UnauthorizedError();
  }
  const resData = {
    adminStatus: adminStatus,
    id: session.adminId,
    email: session.email,
    displayName: session.displayName
  }
  return buildSuccessResponse(req, res, ResponseStatus.OK, resData, {}, "有効なセッションです");
};

/**
 * API仕様（ざっくり）
 * 
 * 1. req.validatedからメールアドレス / パスワードの取得
 * => middleware によって型検証・バリデーションチェックを実施
 * => isValidated ならば req.validated にデータが格納されているので, req.body ではなく req.validated からデータを取得
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

  /**
   * 1. req.validatedからメールアドレス / パスワードの取得
   * => middleware によって型検証・バリデーションチェックを実施
   * => isValidated ならば req.validated にデータが格納されているので, req.body ではなく req.validated からデータを取得
   */
  // TODO: zod から生成した型 AdminSessionInput を使用しているが、別途型ファイルとして AdminLoginInput も用意していたので別途型ファイルの管理について考える
  const { email, password }: AdminSessionInput = (req as any).validated as AdminSessionInput;

  // mail / passwordの存在確認
  if (!email || !password) {
    throw new BadRequestError();
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
  const idPasswordVerifyResult: {
    isVerify: boolean,
    success?: {
      successStatus: SuccessStatus,
      nextPath: string,
      adminInfo: {
        adminId: string,
        adminStatus: AdminStatus,
        email: string,
        displayName: string
      }
    },
    error?: {
      otpMaxRequest: boolean,
      errorStatus: ErrorStatus,
      loginStartTime?: Date; // statusId = 4の場合 UI 側でログイン可能時間を表示するため
    }
  } = await idPasswordVerify(email, password);

  // idPasswordVerifyResult.isVerifyによって処理を分ける
  // TODO 各case内でreturnしないと、statusとerrorCodeがそれぞれ独立したユニオンとなり、あとからまとめてreturnすると型エラーになる、後々、あとからまとめてreturnできるように改善したい
  if (!idPasswordVerifyResult.isVerify) {
    switch (idPasswordVerifyResult.error?.errorStatus) {
      case ResponseStatus.UNAUTHORIZED:
        throw new UnauthorizedError("ID（メールアドレス）またはパスワードが異なります。", {});
      case ResponseStatus.LOCKED:
        if (idPasswordVerifyResult.error.otpMaxRequest) {
          const message = "ワンタイムパスワード入力制限に達しました。\n\nこのメールアドレスでのアカウント登録は48時間できません。\n\n48時間経過後に再度ご登録お願いします。";
          throw new MaxRequestError({}, message, )
        }
        if (idPasswordVerifyResult.error.loginStartTime) {
          const loginStartTime: string= idPasswordVerifyResult.error.loginStartTime.toISOString();
          const details = {
            "retryAfterAt": String(loginStartTime)
          };
          throw new MaxRequestError(details);
        }
        throw new UnauthorizedError("ID（メールアドレス）またはパスワードが異なります。", {});
      default:
        throw new UnauthorizedError("ID（メールアドレス）またはパスワードが異なります。", {});
    }
  }

  /**
  * 3. Session / CSRF token の発行
  * Session ID / CSRF token の発行を行う
  * => 発行完了: 200 or 202 
  * => 発行失敗（Session ID）: 500 / LN_ADMIN_SID_ISSUANCE_FAILED
  * => 発行失敗（CSRF token）: 500 / CSRF_ISSUANCE_FAILED
   */
  // ID / Password 検証の結果データが正常に取得できているか確認
  if (
    !idPasswordVerifyResult.success?.successStatus ||  // ステータスの確認
    !idPasswordVerifyResult.success?.nextPath ||  // nextPathの確認
    !idPasswordVerifyResult.success?.adminInfo.adminId ||  // adminIdの確認
    !idPasswordVerifyResult.success?.adminInfo.adminStatus || // adminStatusの確認
    !idPasswordVerifyResult.success?.adminInfo.email ||  // emailの確認
    !idPasswordVerifyResult.success?.adminInfo.displayName  // displayNameの確認
  ) {
    throw new UnauthorizedError("ID（メールアドレス）またはパスワードが異なります。", {});
  }

  // resDataの組み立て
  let status: SuccessStatus = idPasswordVerifyResult.success.successStatus;

  const resNextPath = idPasswordVerifyResult.success.nextPath;
  const resAdminId = idPasswordVerifyResult.success.adminInfo.adminId;
  const resAdminStatus = idPasswordVerifyResult.success.adminInfo.adminStatus; // 現在はresponseには含めていない, UI側で使用する場合は含めて送る
  const resEmail = idPasswordVerifyResult.success.adminInfo.email;
  const resDisplayName = idPasswordVerifyResult.success.adminInfo.displayName;

  let resData = {};
  let metaData = {};

  // 管理者ログインログ記録用
  if (!res.locals.loginLog) {
    res.locals.loginLog = {};
  }
  res.locals.loginLog.adminId = Number(resAdminId);

  // Session IDの発行処理
  const sid: string | null = await createSession(req, Number(resAdminId), resAdminStatus, resEmail, resDisplayName);
  if (!sid) {
    throw new LnAdminSidIssuanceFailedError();
  }
  // Cookieへセット
  setAdminSidCookie(res, sid, resAdminStatus);
  setAdminStatusCookie(res, resAdminStatus);

  // CSRF tokenの発行処理
  const csrf: string | null = await createCsrf(sid, resAdminStatus);
  if (!csrf) {
    throw new CsrfIssuanceFailedError();
  }

  // CSRF token のセット
  metaData = {
    csrfToken: csrf
  };

  let successMessage: string = "";
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
      successMessage = "ログインに成功しました";
      break;
    case ResponseStatus.ACCEPTED:
      resData = {
        nextPath: resNextPath,
        otpDeliveryAddress: resEmail
      }
      successMessage = "OTP認証が必要です"
      break;
    default:
      throw new UnauthorizedError("ID（メールアドレス）またはパスワードが異なります。", {});
  };

  return buildSuccessResponse(req, res, status, resData, metaData, successMessage);

}

/**
 * API仕様
 * 1. Cookie から ln_admin_sid, admin_status, RequestHeader から x-csrf-token を取得
 *    ・ ln_admin_sid が存在しない
 *        ・ API仕様書未定義
 *          ・ 暫定的にログアウト処理を行う
 *          ・ Redis内 ln_admin_sid, csrf の削除はスキップ（sidが存在しないため redis 内を検索できない）, 204
 *            ※ ブラウザはSet-Cookie: ln_admin_sid=; とすることで強制的に空の sid で更新させる
 *    ・ x-csrf-token 未送信
 *        ・ 400 / CSRF_MISSING_HEADER
 * 2. ln_admin_sid, x-csrf-token の検証を行う
 * 3. 検証結果に応じて以下分岐した処理を行う
 *    ・ CSRFトークン 検証エラー
 *        ・ 403 / CSRF_FORBIDDEN
 *    ・ 検証成功時
 *        ・ Redis内 ln_admin_sid, csrf の削除後, 204
 *          ※ ブラウザはSet-Cookie: ln_admin_sid=; とすることで強制的に空の sid で更新させる
 */
export const deleteAdminSession = async (req: Request, res: Response) => {
  // 1. Cookie から ln_admin_sid, admin_status, RequestHeader から x-csrf-token を取得
  const sid = req.cookies?.[Cookies.COOKIE_NAME_ADMIN_SESSION];
  const adminStatus = req.cookies?.[Cookies.COOKIE_NAME_ADMIN_STATUS];

  const csrfToken = req.header(requestHeaders.CSRF_TOKEN_HEADER);

  if (!sid || !adminStatus) {
    // redis内 ln_admin_sid, csrf の削除はスキップ（sidが存在しないため redis 内を検索できない）

    // Cookie の削除
    deleteAdminSidCookie(res);
    deleteAdminStatusCookie(res);

    return buildSuccessResponse(req, res, ResponseStatus.NO_CONTENT, {}, {});
  }

  if (!csrfToken) {
    throw new BadRequestError("X-CSRF-Token required", ResponseStatus.BAD_REQUEST, "CSRF_MISSING_HEADER");
  }

  // 2. ln_admin_sid, x-csrf-token の検証を行う
  console.log('in');
  const verifyResultSid = await verifySessionOld(sid, adminStatus);
  console.log('out');

  console.log(!verifyResultSid?.verifyResult);
  if (!verifyResultSid?.verifyResult) {
    throw new UnauthorizedError();
  }
  const verifyResultCsrf: boolean = await verifyCsrf(sid, csrfToken);

  // 3. 検証結果に応じて以下分岐した処理を行う
  if (!verifyResultCsrf) {
    throw new ForbiddenError();
  }

  // Redis内 ln_admin_sid, csrf の削除
  await Promise.all([
    deleteSession(sid, adminStatus),
    deleteCsrf(sid)
  ]);

  // Cookie の削除
  deleteAdminSidCookie(res);
  deleteAdminStatusCookie(res);

  return buildSuccessResponse(req, res, ResponseStatus.NO_CONTENT, {}, {});
};

/**
 * セッション延長関数（CSRFトークンの更新を含む）
 * 
 * ▼処理内容
 * 1. ln_admin_sid, csrfToken の有効性を検証する
 *    ・CSRFトークン未送信の場合は 400 / CSRF_MISSING_HEADER
 *    ・ln_admin_sid 検証エラーの場合は 401 / UNAUTHORIZED
 *    ・CSRFトークン検証エラーの場合は 403 / CSRF_FORBIDDEN
 * 2. ln_admin_sid, csrfToken をそれぞれ更新する
 *    ・ln:admin:sid:${sid} / ln:admin:tmp_sid:${sid} の更新
 *    ・ln:admin:current_sid:${adminId} の更新
 * 3. 更新処理が成功した場合は200 / OK を返却
 *    ・Cookieへ ln_admin_sid, adminStatus のセット
 * @param req 
 * @param res 
 */
export const postAdminSessionRefresh = async (req: Request, res: Response) => {
  // 1. ln_admin_sid, csrfToken の有効性を検証する

  // Cookie から sid, adminStatus を取得
  const sid = req.cookies?.[Cookies.COOKIE_NAME_ADMIN_SESSION] ?? "";
  const rawAdminStatus = req.cookies?.[Cookies.COOKIE_NAME_ADMIN_STATUS]
  const adminStatus = Number(rawAdminStatus) as AdminStatus;

  // req.header から x-csrf-token を取得
  const csrf = req.header(requestHeaders.CSRF_TOKEN_HEADER);

  // CSRFトークン未送信の場合は 400 / CSRF_MISSING_HEADER
  if (!csrf) {
    throw new BadRequestError("X-CSRF-Token required", ResponseStatus.BAD_REQUEST, "CSRF_MISSING_HEADER");
  }

  // sid の検証
  const sidData = await verifySessionOld(sid, adminStatus);
  const verifyResultSid = sidData?.verifyResult;

  // ln_admin_sid 検証エラーの場合は 401 / UNAUTHORIZED
  if (!verifyResultSid) {
    throw new UnauthorizedError();
  }
  // CSRFトークンの検証
  const verifyResultCsrf = await verifyCsrf(sid, csrf);

  // CSRFトークン検証エラーの場合は 403 / CSRF_FORBIDDEN
  if (!verifyResultCsrf) {
    throw new ForbiddenError();
  }

  // 2. ln_admin_sid, csrfToken をそれぞれ更新する
  // 旧セッションIDの内容を一部引き継ぐ
  const oldSidData = await getSession(sid, adminStatus);

  if (!oldSidData) {
    throw new LnAdminSidIssuanceFailedError();
  }

  const adminId = Number(oldSidData.adminId);
  const email = oldSidData.email;
  const displayName = oldSidData.displayName;

  // 新規セッションの発行
  // ・ln:admin:sid:${sid} / ln:admin:tmp_sid:${sid} の更新
  // ・ln:admin:current_sid:${adminId} の更新
  const newSid = await createSession(req, adminId, adminStatus, email, displayName);

  // 新規CSRFトークンの発行
  // ・ln:admin:current_sid:${adminId} の更新
  const newCsrfToken = await createCsrf(newSid, adminStatus);

  // 3. 更新処理が成功した場合は200 / OK を返却
  // ・Cookieへ ln_admin_sid, adminStatus のセット
  setAdminSidCookie(res, newSid, adminStatus);
  setAdminStatusCookie(res, adminStatus);
  
  // response用のデータの組み立て
  const newSidData = await getSession(newSid, adminStatus);

  console.log(!newSidData);
  if (!newSidData) {
    throw new InternalServerError();
  }

  const message = "セッションを延長しました";
  const resData = {
    refreshed: true,
    expiresAt: newSidData.expiredAt
  }
  const metaData = {
    csrfToken: newCsrfToken
  }

  return buildSuccessResponse(req, res, ResponseStatus.OK, resData, metaData, message);
}
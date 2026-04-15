import { Cookies, NextPaths, ResponseStatus } from "@config/constants";
import { InternalServerError, UnauthorizedError } from "@errors";
import { buildSuccessResponse } from "@lib/response/buildResponse";
import { RegisterAdminInput } from "@schemas/registerAdmin.schema";
import * as adminsService from "@services/postgres/admins.service";
import { createSession, getSession } from "@services/redis/sessionService";
import { AdminStatus } from "@types";
import { getLoginAdminId } from "@utils/admins/getLoginAdminId";
import { Request, Response } from "express"
import { getAdminSession } from "./session.controller";
import { setAdminSidCookie } from "@utils/cookie/setCookie";
import { createCsrf } from "@services/redis/csrfService";

/**
 * 管理者一覧取得API
 * 
 * ▼ 処理概要
 * 1. ln_admin_sid, admin_status から セッション内 admin_id を取得
 *    ※ln_admin_sid, admin_status の有効性はミドルウェアで検証済みの前提
 * 2. QueryParameter と セッションにセットされている admin_id を使用して 管理者一覧を取得
 *    ※バリデーションチェックは middleware で実施済みなので, (req as any).validatedQuery から QueryParameter を取得する
 * 3. 取得した管理者一覧からレスポンス用のデータを組み立ててレスポンスを送信
 * 
 * @param req - HTTPリクエストオブジェクト
 * @param res - HTTPレスポンスオブジェクト
 * @returns HTTPレスポンス
 */
export const getAdmins = async (req: Request, res: Response) => {
  // 1. ln_admin_sid, admin_status から セッション内 admin_id を取得
  const sid = req.cookies?.[Cookies.COOKIE_NAME_ADMIN_SESSION];
  const adminStatus = Number(req.cookies?.[Cookies.COOKIE_NAME_ADMIN_STATUS]) as AdminStatus;

  // Number.isNaN() : 引数を型変換せずに NaN かどうかを判断する
  // isNaN() : 引数を Number へ型変換してから NaN かどうかを判断する
  // adminStatus は Number() で数値変換した値なので Number.isNaN() を使用する
  if (!sid || Number.isNaN(adminStatus)) throw new UnauthorizedError();

  const session = await getSession(sid, adminStatus);
  if (!session || !session.adminId) throw new UnauthorizedError();

  const loginAdminId = BigInt(session.adminId);

  // 2. QueryParameter と セッションにセットされている admin_id を使用して 管理者一覧を取得
  const query = (req as any).validatedQuery;

  const result = await adminsService.getAdmins(query, loginAdminId);

  // 3. 取得した管理者一覧からレスポンス用のデータを組み立ててレスポンスを送信
  const data = result.data;
  const meta = result.meta;
  const message = '管理者一覧を取得しました。';
  if (!data || !meta) throw new InternalServerError();

  return buildSuccessResponse(req, res, ResponseStatus.OK, data, meta, message);
};

/**
 * 管理者詳細取得API
 * 
 * ▼処理概要
 * 1. ln_admin_sid, admin_status から セッション内 admin_id を取得
 *    ※ln_admin_sid, admin_status の有効性はミドルウェアで検証済みの前提
 * 2. PathParams と セッションにセットされている admin_id を使用して 管理者詳細を取得
 *    ※バリデーションチェックは middleware で実施済みなので, (req as any).validatedParams から PathParameters を取得する
 * 3. 取得した管理者詳細からレスポンス用のデータを組み立ててレスポンスを送信
 * 
 * @param req 
 * @param res 
 * @return HTTPレスポンス
 */
export const getAdminDetail = async (req: Request, res: Response) => {
  // 1. ln_admin_sid, admin_status から セッション内 admin_id を取得
  const sid = req.cookies?.[Cookies.COOKIE_NAME_ADMIN_SESSION];
  const adminStatus = Number(req.cookies?.[Cookies.COOKIE_NAME_ADMIN_STATUS]) as AdminStatus;

  // Number.isNaN() : 引数を型変換せずに NaN かどうかを判断する
  // isNaN() : 引数を Number へ型変換してから NaN かどうかを判断する
  // adminStatus は Number() で数値変換した値なので Number.isNaN() を使用する
  if (!sid || Number.isNaN(adminStatus)) throw new UnauthorizedError();

  const session = await getSession(sid, adminStatus);
  if (!session || !session.adminId) throw new UnauthorizedError();

  const loginAdminId = BigInt(session.adminId);

  // 2. PathParams と セッションにセットされている admin_id を使用して 管理者詳細を取得
  const params = (req as any).validatedParams;
  const result = await adminsService.getAdminDetail(params, loginAdminId);

  // 3. 取得した管理者詳細からレスポンス用のデータを組み立ててレスポンスを送信
  if (!result.data) throw new InternalServerError();

  const data = result.data;
  const message = '管理者詳細を取得しました。'

  return buildSuccessResponse(req, res, ResponseStatus.OK, data, {}, message);
};

/**
 * 管理者編集API
 * 
 * ▼ 処理概要
 * 1. ln_admin_sid, admin_status から セッション内 admin_id を取得
 *    ※ln_admin_sid, admin_status の有効性はミドルウェアで検証済みの前提
 * 2. PathParams と セッションにセットされている admin_id と requestBody を使用して管理者情報を更新
 *    ※バリデーションチェックは middleware で実施済みなので, (req as any).validatedParams から PathParameters を取得する
 *    ※同様に body データも, (req as any).validatedBody から取得する
 * 3. 更新情報からレスポンス用のデータを組み立ててレスポンスを送信
 * 4. セッションとCSRFトークンの更新
 */
export const patchAdminDetail = async (req: Request, res: Response) => {
  // 1. ln_admin_sid, admin_status から セッション内 admin_id を取得
  const loginAdminId: bigint = await getLoginAdminId(req);

  // 2. PathParams と セッションにセットされている admin_id と requestBody を使用して管理者情報を更新
  const params = (req as any).validatedParams;
  const body = (req as any).validatedBody;

  const result = await adminsService.patchOtherAdmin(params, body, loginAdminId);

  // 3. 更新情報からレスポンス用のデータを組み立ててレスポンスを送信
  if (!result.data) throw new InternalServerError();
  const data = result.data;
  const message = '管理者情報を更新しました。';

  // 4. セッションとCSRFトークンの更新
  const session = await getSession(req.cookies[Cookies.COOKIE_NAME_ADMIN_SESSION], req.cookies[Cookies.COOKIE_NAME_ADMIN_STATUS]);

  // ln_admin_sid の再発行
  if (
    !session ||
    !session.adminId ||
    !session.email ||
    !session.displayName
  ) {
    throw new InternalServerError();
  }

  const loginAdminStatusId = Number(req.cookies[Cookies.COOKIE_NAME_ADMIN_STATUS]) as AdminStatus;
  const newSid = await createSession(req, Number(session.adminId), loginAdminStatusId, session.email, session.displayName);
  setAdminSidCookie(res, newSid, loginAdminStatusId);

  // csrf token の再発行
  const newCsrfToken = await createCsrf(newSid, loginAdminStatusId);
  const meta = { csrfToken: newCsrfToken };

  return buildSuccessResponse(req, res, ResponseStatus.OK, data, meta, message);

};

/**
 * 管理者登録API
 * 
 * ▼処理概要
 * 1. request 内から email, passwordを取得する
 * 2. admin テーブルに email, passwordを保存する※ password はハッシュ化されて保存される
 *    ・email に重複がある場合 : 409 / Conflict
 *    ・email に重複がない場合 : 201 / Created 
 * @param req - HTTPリクエストオブジェクト
 * @param res - HTTPレスポンスオブジェクト
 * @returns HTTPレスポンス
 */
export const postAdmin = async (req: Request, res: Response) => {
  // 1. request 内から email, passwordを取得する
  const validated = (req as any).validatedBody as RegisterAdminInput | undefined;

  if (!validated) {
    throw new InternalServerError();
  }
  const { email, password } = validated;

  // 2. admin テーブルに email, passwordを保存する※ password はハッシュ化されて保存される
  await adminsService.createAdmin(email, password);

  const data = {
    nextPath: NextPaths.REGISTER_COMPLETED
  };
  const message: string = "登録完了";

  return buildSuccessResponse(req, res, ResponseStatus.CREATED, data, {}, message)
};
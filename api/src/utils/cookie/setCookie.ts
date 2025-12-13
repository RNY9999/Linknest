import { Response } from "express"
import { AdminStatuses, Cookies, SESSION_TTL_MS, SESSION_TTL_TMP_MS } from "@config/constants";
import { AdminStatus } from "@types";
import { LnAdminSidIssuanceFailedError } from "@errors";

// TODO: ファイルとして全体的にリファクタリングできるのでよろしく
// TODO: セッション削除は Express 側で関数が用意されてそうだよ
/**
 * ▼ 属性に関して
 * ・ HttpOnly: JavaScript からの Cookie の参照を禁止する
 * ・ Secure: HTTPS プロトコル上の暗号化されてるリクエストでのみサーバに送信される
 *    ※http:localhostの場合は、ブラウザによるがSecureでも送信される
 * ・ Path: Cookie を送信する際に送信リクエストに含む必要があるURL（前方一致で比較）
 * ・ SameSite: サードパーティークッキーの送信制御
 *    ・ Strict: Cookie 送信するページのURLと発行元が一致する場合に Cookie が送信される
 *    ・ Lax: 基本は Strict と同義だが, トップレベルナビゲーションかつ安全なメソッド（GET等）でも Cookie が送信される
 *    ・ None: すべてのリクエストに Cookie を含めて送信
 */

/**
 * Cookie: ln_admin_sid セット関数
 */
export const setAdminSidCookie = (res: Response, sid: string, adminStatus: AdminStatus): void => {
  if (!res || !sid || !adminStatus) {
    throw new LnAdminSidIssuanceFailedError();
  };

  let maxAge: number = 0;

  // TODO: 以下の Switch 文よく見るので Utils に切り出すといいかも
  switch (Number(adminStatus)) {
    case AdminStatuses.TMP_REGISTER:
      maxAge = SESSION_TTL_TMP_MS;
      break;
    case AdminStatuses.REGISTER:
      maxAge = SESSION_TTL_MS;
      break;
    default:
      throw new LnAdminSidIssuanceFailedError();
  }

  const cookieAttribute = {
    httpOnly: true,
    secure: true,
    path: "/",
    sameSite: "none",
    maxAge: maxAge
  } as const;

  // cookieのセット
  res.cookie(
    Cookies.COOKIE_NAME_ADMIN_SESSION,
    sid,
    cookieAttribute
  );

}

/**
 * Cookie: admin_status セット関数
 * 
 * @param res - responseオブジェクト
 * @param adminStatus - 管理者ステータス（1 ~ 5）
 */
export const setAdminStatusCookie = (res: Response, adminStatus: AdminStatus): void => {
  let maxAge: number = 0;

  // TODO: 以下の Switch 文よく見るので Utils に切り出すといいかも
  // TODO: セッション用の定数を使っているので意図がわかりにくいので要修正
  switch (Number(adminStatus)) {
    case AdminStatuses.TMP_REGISTER:
      maxAge = SESSION_TTL_TMP_MS;
      break;
    case AdminStatuses.REGISTER:
      maxAge = SESSION_TTL_MS;
      break;
    default:
      throw new LnAdminSidIssuanceFailedError();
  }

  const cookieAttribute = {
    httpOnly: true,
    secure: true,
    path: "/",
    sameSite: "none",
    maxAge: maxAge
  } as const;

  // cookieのセット
  res.cookie(
    Cookies.COOKIE_NAME_ADMIN_STATUS,
    adminStatus,
    cookieAttribute
  );
};

/**
 * Cookie: ln_admin_sid 削除関数
 * ※実際は "" で上書きしている（Max-age: 0）
 */
export const deleteAdminSidCookie = (res: Response): void => {
  const sid: string = "";
  const maxAge: number = 0;

  const cookieAttribute = {
    httpOnly: true,
    secure: true,
    path: "/",
    sameSite: "none",
    maxAge: maxAge
  } as const;

  // cookieのセット
  res.cookie(
    Cookies.COOKIE_NAME_ADMIN_SESSION,
    sid,
    cookieAttribute
  );
};

/**
 * Cookie: admin_status 削除関数
 * ※実際は "" で上書きしている（Max-age: 0）
 */
export const deleteAdminStatusCookie = (res: Response): void => {
  const adminStatus: string = "";
  const maxAge: number = 0;

  const cookieAttribute = {
    httpOnly: true,
    secure: true,
    path: "/",
    sameSite: "none",
    maxAge: maxAge
  } as const;

  // cookieのセット
  res.cookie(
    Cookies.COOKIE_NAME_ADMIN_STATUS,
    adminStatus,
    cookieAttribute
  );
}
import { Response } from "express"
import { AdminStatuses, Cookies, SESSION_TTL_MS, SESSION_TTL_TMP_MS } from "@config/constants";
import { AdminStatus } from "@types";

/**
 * Cookie: ln_admin_sid をセットする関数
 * ▼ 属性に関して
 * - HttpOnly: JavaScript からの Cookie の参照を禁止する
 * - Secure: HTTPS プロトコル上の暗号化されてるリクエストでのみサーバに送信される
 *  ※http:localhostの場合は、ブラウザによるがSecureでも送信される
 * - Path: Cookie を送信する際に送信リクエストに含む必要があるURL（前方一致で比較）
 * - SameSite: サードパーティークッキーの送信制御
 *  - Strict: Cookie 送信するページのURLと発行元が一致する場合に Cookie が送信される
 *  - Lax: 基本は Strict と同義だが, トップレベルナビゲーションかつ安全なメソッド（GET等）でも Cookie が送信される
 *  - None: すべてのリクエストに Cookie を含めて送信
 */
export const setAdminSidCookie = (res: Response, sid: string, adminStatus: AdminStatus): void => {
  if (!res || !sid || !adminStatus) {
    throw new Error("[Cookie Set] res or sid is not existed");
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
      throw new Error("[Cookie Set] admin status is bad status");
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
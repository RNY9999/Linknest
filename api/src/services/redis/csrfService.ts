import { redis } from "@lib/redis";
import { AdminStatuses, CSRF_TTL_SEC, CSRF_TTL_TMP_SEC } from "@config/constants";
import { createSecureCsrfToken } from "@lib/crypto"
import { AdminStatus } from "@types";
import { adminCsrfKey } from "../../utils/redis/getKey";
import { CsrfIssuanceFailedError } from "@errors";

/**
 * CSRFトークン登録関数
 * ▼ざっくり流れ
 * 1. 32byte(base64url)のCSRFトークンを生成
 * 2. ln:admin:csrf:${current_sid} にCSRFトークンを保存
 * ※本登録の場合 TTL : 30分, 仮登録の場合 TTL : 15分
 * ※すでに存在する場合は上書き保存でOK
 * 3. 
 * @returns CSRFトークン ( string )
 */
export const createCsrf = async (current_sid: string, adminStatus: AdminStatus): Promise<string> => {
  /**
   * 1. 32byte(base64url) のCSRFトークンを生成
   */
  const csrfToken: string = createSecureCsrfToken();

  /**
   * 2. ln:admin:csrf:${current_sid} にCSRFトークンを保存
   * ※本登録の場合 TTL : 30分, 仮登録の場合 TTL : 15分
   * ※すでに存在する場合は上書き保存でOK
   */
  let exSecond: number = 0; // Redis 保存時のTTL (秒)
  const csrfKey: string = adminCsrfKey(current_sid); // Redis 保存用の Key

  switch (Number(adminStatus)) {
    case AdminStatuses.TMP_REGISTER:
      exSecond = CSRF_TTL_TMP_SEC;
      break;
    case AdminStatuses.REGISTER:
      exSecond = CSRF_TTL_SEC;
      break;
    default:
      throw new CsrfIssuanceFailedError();
  }

  // 同一のキーが存在する場合は上書きする
  const isSet = await redis
    .set(
      csrfKey,
      csrfToken,
      {
        EX: exSecond
      }
    );

  if (isSet !== "OK") {
    throw new CsrfIssuanceFailedError();
  }

  return csrfToken;
}

/**
 * CSRF検証関数
 * 
 * ▼流れ
 * 1. currentSidからredis検索用のパスを作成
 * 2. 作成したパスを用いてCSRFトークンを取得 ※取得できなかった場合は false を返却
 * 3. 取得しCSRFトークンと検証用の csrfToken を比較し、結果を返却
 * 
 * @param currentSid - ln_admin_sid: 最新のCSRFトークンを検索する際に使用
 * @param receivedCsrfToken - csrf token: 検証対象のCSRFトークン
 * @returns 検証結果: true | false を返却
 */
export const verifyCsrf = async (currentSid: string, receivedCsrfToken: string): Promise<boolean> => {
  // 1. currentSidからredis検索用のパスを作成
  const csrfKey: string = adminCsrfKey(currentSid);

  // 2. 作成したパスを用いてCSRFトークンを取得
  const csrfToken: string | null = await redis.get(csrfKey);

  // CSRFトークンが取得できなかった場合 false を返却
  if (!csrfToken) {
    return false;
  }

  // 3. 取得しCSRFトークンと検証用の csrfToken を比較し、結果を返却
  return csrfToken === receivedCsrfToken;
}

/**
 * CSRFトークン削除関数
 * 1. currentSid(ln_admin_sid)を取得し、CSRFトークンのKeyを取得
 *    ・ln:admin:csrf:{sid}
 * 2. csrfKey に保存されている CSRFトークンを削除
 * 
 * @param currentSid - 最新のセッションID
 */
export const deleteCsrf = async (currentSid: string): Promise<void> => {
  // 1. currentSid(ln_admin_sid)を取得し、CSRFトークンのKeyを取得
  const csrfKey = adminCsrfKey(currentSid);

  // 2. csrfKey に保存されている CSRFトークンを削除
  await redis.del(csrfKey);
}
import { redis } from "@lib/redis";
import { AdminStatuses, CSRF_TTL_SEC, CSRF_TTL_TMP_SEC } from "@config/constants";
import { createSecureCsrfToken } from "@lib/crypto"
import { AdminStatus } from "@types";
import { adminCsrfKey } from "../../utils/redis/getKey";

/**
 * CSRFトークン登録関数
 * ▼ざっくり流れ
 * 1. 32byte(base64url)のCSRFトークンを生成
 * 2. ln:admin:csrf:${current_sid} にCSRFトークンを保存
 * ※本登録の場合 TTL : 30分, 仮登録の場合 TTL : 15分
 * ※すでに存在する場合は上書き保存でOK
 * 3. 
 */
export const createCsrf = async (current_sid: string, adminStatus: AdminStatus) => {
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
      throw new Error("CSRF_TOKEN_CREATE_ERROR");
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
    throw new Error("CSRF_TOKEN_CREATE_ERROR");
  }

  return csrfToken;
}
import crypto from "node:crypto";

/**
 * sid 生成関数
 * 引数として受け取ったバイト数分のバイトを生成し, base64url によってエンコードされる
 * @param bytes - number: sid のバイト数
 * @returns string: sid
 */
export const createSecureSid = (bytes: number = 32): string => {
  return crypto.randomBytes(bytes).toString("base64url");
}

/**
 * csrf token 生成関数
 * 引数として受け取ったバイト数分のバイトを生成し, base64url によってエンコードされる
 * @param bytes - number: csrf token のバイト数
 * @returns string: csrf token
 */
export const createSecureCsrfToken = (bytes: number = 32): string => {
  return crypto.randomBytes(bytes).toString("base64url");
}

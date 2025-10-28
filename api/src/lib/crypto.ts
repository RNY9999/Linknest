import crypto from "node:crypto";

/**
 * sid 生成関数
 * 引数として受け取ったバイト数分のバイトを生成し, base64url によってエンコードされる
 * @param bytes - number: 実際に出力される sid のバイト数
 * @returns string: sid, 引数の bytes 分だけ出力される
 */
export const createSecureSid= (bytes: number = 32): string => {
  return crypto.randomBytes(bytes).toString("base64url");
}

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

/**
 * otp 生成関数
 * 
 * ・min <= OTP < max となるOTPを返却
 * ・先頭0埋めに対応するために、文字列方に変換後、先頭を0埋め
 * 
 * @param min - 最小値（デフォルト 0）
 * @param max - 最大値（デフォルト 1000000）
 * @return OTP（デフォルトで6桁の数字を String にしたもの）
 */
export const createOtp = (min: number = 0, max: number = 1000000) => {
  const digits: number = String(max - 1).length;
  return crypto.randomInt(min, max).toString().padStart(digits, '0');
}

/**
 * ハッシュ値取得関数
 * 
 * デフォルトで電子政府推奨暗号である SHA256 を用いて, 256bitのハッシュを生成
 * 注意：ハッシュ化したいメッセージは文字列に直してからこの関数の引数とすること
 * @param message - ハッシュ化するメッセージ
 * @param hashAlgorithm - デフォルトで SHA256
 * @return string : ハッシュ値（256bit）
 */
export const createHash = (message: string, hashAlgorithm = 'sha256'): string => {
  return crypto.createHash(hashAlgorithm).update(message).digest('hex');
}

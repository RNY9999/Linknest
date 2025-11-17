import { ResponseStatus } from "@config/constants";
import { ErrorCode, ErrorMessage, ErrorStatus } from "@types"

/**
 * Linknest独自のエラークラスを定義
 * 
 * success   : 基本的には false
 * status    : HTTP ステータス（4xx, 5xx, ...）
 * code      : Linknest 独自のエラーコード（"UNAUTHORIZED" など）
 * message   : Linknest で使用するメッセージ / UI側でユーザーに表示する
 * details   : nextPath 等を格納
 * requestId : デバック用などに用いる
 * timestamp : デバック用などに用いる
 */
export class ApiError extends Error {
  success: boolean;
  status: ErrorStatus;
  code: ErrorCode;
  details: object;
  constructor(
    status: ErrorStatus,
    code: ErrorCode,
    message: ErrorMessage,
    details: object = {},
    success: boolean = false,
    cause?: unknown
  ) {
    super(message, { cause });
    this.success = success;
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * 頻繁に使用するエラーは先にクラスとして作成する
 */

// 500 InternalServerError
export class InternalServerError extends ApiError {
  constructor(
    message: ErrorMessage = "現在、サーバーエラーが発生しています。\nお手数ですが、一定時間経過後に再度ログインをお願いします。\n",
    status: ErrorStatus = ResponseStatus.INTERNAL_SERVER_ERROR,
    code: ErrorCode = "INTERNAL_SERVER_ERROR",
    cause?: unknown
  ) {
    super(status, code, message, undefined, undefined, cause);
  }
}

// 500 LnAdminSidIssuanceFailedError
export class LnAdminSidIssuanceFailedError extends ApiError {
    constructor(
    message: ErrorMessage = "Cannot issue ln_admin_sid",
    status: ErrorStatus = ResponseStatus.INTERNAL_SERVER_ERROR,
    code: ErrorCode = "LN_ADMIN_SID_ISSUANCE_FAILED",
    cause?: unknown
  ) {
    super(status, code, message, undefined, undefined, cause);
  }
}

// 500 CsrfIssuanceFailedError
export class CsrfIssuanceFailedError extends ApiError {
    constructor(
    message: ErrorMessage = "Cannot issue CSRF",
    status: ErrorStatus = ResponseStatus.INTERNAL_SERVER_ERROR,
    code: ErrorCode = "CSRF_ISSUANCE_FAILED",
    cause?: unknown
  ) {
    super(status, code, message, undefined, undefined, cause);
  }
}

// 400 BadRequest
export class BadRequestError extends ApiError {
  constructor(
    message: ErrorMessage = "不正な入力値です。",
    status: ErrorStatus = ResponseStatus.BAD_REQUEST,
    code: ErrorCode = "BAD_REQUEST",
    cause?: unknown
  ) {
    super(status, code, message, undefined, undefined, cause);
  }
}

// 401 Unauthorized
export class UnauthorizedError extends ApiError {
    constructor(
    message: ErrorMessage = "セッションが無効です。",
    status: ErrorStatus = ResponseStatus.UNAUTHORIZED,
    code: ErrorCode = "UNAUTHORIZED",
    cause?: unknown
  ) {
    super(status, code, message, undefined, undefined, cause);
  }
}

// 423 MaxRequestError
export class MaxRequestError extends ApiError {
    constructor(
    message: ErrorMessage = "現在アカウントがロックされています。\n○○時○○分以降に再度ログインをお試しください。",
    status: ErrorStatus = ResponseStatus.LOCKED,
    code: ErrorCode = "MAX_REQUEST",
    cause?: unknown
  ) {
    super(status, code, message, undefined, undefined, cause);
  }
}
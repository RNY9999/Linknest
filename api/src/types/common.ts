// API共通の成功/失敗の形を統一
export type SuccessCode =
  | 200
  ;

export type ErrorCode =
  | 401
  | 500
  ;

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INTERNAL_SERVER_ERROR"
  | "CSRF_ISSUANCE_FAILED"
  | "LN_ADMIN_SID_ISSUANCE_FAILED"
  ;

export type ApiSuccess<Data> = {
  code: "OK";
  data: Data;
}

export type ApiError<ErrorCode extends ApiErrorCode> = {
  code: ErrorCode;
  message: string;
  nextPath?: string;
};

export type ErrorMap = {
  401: {
    "UNAUTHORIZED": ApiError<"UNAUTHORIZED">;
    "BAD_REQUEST": ApiError<"BAD_REQUEST">;
  };
  500: {
    "CSRF_ISSUANCE_FAILED": ApiError<"CSRF_ISSUANCE_FAILED">;
    "LN_ADMIN_SID_ISSUANCE_FAILED": ApiError<"LN_ADMIN_SID_ISSUANCE_FAILED">;
    "INTERNAL_SERVER_ERROR": ApiError<"INTERNAL_SERVER_ERROR">;
  };
}
// API共通の成功/失敗の形を統一
export type SuccessStatus =
  | 200
  ;

export type ErrorStatus =
  | 401
  | 500
  ;

export type ErrorCode =
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

export type ApiError<Code extends ErrorCode> = {
  code: Code;
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
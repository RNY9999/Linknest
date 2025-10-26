// API共通の成功/失敗の形を統一
export type SuccessStatus =
  | 200
  | 202
  ;

export type ErrorStatus =
  | 400
  | 401
  | 423
  | 500
  ;

export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "INTERNAL_SERVER_ERROR"
  | "CSRF_ISSUANCE_FAILED"
  | "LN_ADMIN_SID_ISSUANCE_FAILED"
  | "MAX_REQUEST"
  ;

export type ApiSuccess<Data> = {
  api: "ok";
  data: Data;
}

export type ApiError<Code extends ErrorCode> = {
  code: Code;
  message: string;
  nextPath?: string;
};

export type ErrorMap = {
  400: {
    "BAD_REQUEST": ApiError<"BAD_REQUEST">;
  }
  401: {
    "UNAUTHORIZED": ApiError<"UNAUTHORIZED">;
  };
  423: {
    "MAX_REQUEST": ApiError<"MAX_REQUEST">;
  };
  500: {
    "CSRF_ISSUANCE_FAILED": ApiError<"CSRF_ISSUANCE_FAILED">;
    "LN_ADMIN_SID_ISSUANCE_FAILED": ApiError<"LN_ADMIN_SID_ISSUANCE_FAILED">;
    "INTERNAL_SERVER_ERROR": ApiError<"INTERNAL_SERVER_ERROR">;
  };
}
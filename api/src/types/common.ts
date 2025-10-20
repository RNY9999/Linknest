// API共通の成功/失敗の形を統一
export type ApiErrorCode = 
  "BAD_REQUEST"   |
  "UNAUTHORIZED"  |
  "FORBIDDEN"     |
  "NOT_FOUND"     |
  "INTERNAL_SERVER_ERROR"
;

export type ApiSuccess<T> = {
  code: "OK";
  data: T;
}

export type ApiError = {
  code: ApiErrorCode;
  message: string;
  nextPath?: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// 型ガード関数
export const isOk = <T>(res: ApiResponse<T>): res is ApiSuccess<T> => {
  return res.code === "OK";
};

export const isError = <T>(res: ApiResponse<T>): res is ApiError => {
  const resCode: ApiErrorCode | "OK" = res.code;
  return resCode !== "OK";
};
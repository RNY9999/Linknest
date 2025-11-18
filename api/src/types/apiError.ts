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

export type ErrorMessage =
  | "サーバーエラーが発生しています"
  | "現在、サーバーエラーが発生しています。\nお手数ですが、一定時間経過後に再度ログインをお願いします。\n"
  | "不正な入力値です。"
  | "セッションが無効です。"
  | "ID（メールアドレス）またはパスワードが異なります。"
  | "Cannot issue CSRF"
  | "Cannot issue ln_admin_sid"
  | `現在アカウントがロックされています。\n${string}時${string}分以降に再度ログインをお試しください。`
  ;

export type ErrorResponse = {
  success: false;
  code: ErrorCode;
  message: string;
  details: {
    nextPath?: string;
  };
  requestId: string;
  timestamp: string;
};
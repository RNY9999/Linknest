export type ErrorStatus =
  | 400
  | 401
  | 403
  | 404
  | 409
  | 423
  | 500
  ;

export type ErrorCode =
  | "BAD_REQUEST"
  | "CSRF_MISSING_HEADER"
  | "UNAUTHORIZED"
  | "INTERNAL_SERVER_ERROR"
  | "CSRF_ISSUANCE_FAILED"
  | "CSRF_FORBIDDEN"
  | "LN_ADMIN_SID_ISSUANCE_FAILED"
  | "MAX_REQUEST"
  | "CONFLICT_ADMIN_EMAIL"
  | "OTP_UNAUTHORIZED"
  | "NOT_FOUND"
  ;

export type ErrorMessage =
  | "サーバーエラーが発生しています"
  | "現在、サーバーエラーが発生しています。\nお手数ですが、一定時間経過後に再度ログインをお願いします。\n"
  | "不正な入力値です。"
  | "セッションが無効です。"
  | "ID（メールアドレス）またはパスワードが異なります。"
  | "Cannot issue CSRF"
  | "CSRFトークンが無効です。"
  | "X-CSRF-Token required"
  | "Cannot issue ln_admin_sid"
  | "現在アカウントがロックされています。\n{retryTime}以降に再度ログインをお試しください。"
  | "ワンタイムパスワード入力制限に達しました。\n\nこのメールアドレスでのアカウント登録は48時間できません。\n\n48時間経過後に再度ご登録お願いします。"
  | "すでに登録済みのメールアドレスです。"
  | "入力内容に誤りがあります。\n\n合計{maxAttempts}回間違えると48時間の間、\nこのメールアドレスでのアカウント登録が無効となります。\n\n回答誤り : 「{failedCount}」回目"
  | "お探しのページは存在しません。"
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
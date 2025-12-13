export const AdminStatuses = {
  TMP_REGISTER: 1,
  TMP_REGISTER_LOCK: 2,
  REGISTER: 3,
  REGISTER_LOCK: 4,
  REGISTER_RETIRE: 5
} as const;

export const Environment = {
  DEV: 'development',
  STG: 'staging',
  PROD: 'production',
};

export const Cookies = {
  COOKIE_NAME_ADMIN_SESSION: "ln_admin_sid",
  COOKIE_NAME_ADMIN_STATUS: "admin_status"
};

export const requestHeaders = {
  CSRF_TOKEN_HEADER: "x-csrf-token",
};

export const ResponseStatus = {
  // 成功レスポンス
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  // エラーレスポンス
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  LOCKED: 423,
  INTERNAL_SERVER_ERROR: 500
} as const;

export const NextPaths = {
  TOP: "/top",
  FIRST_LOGIN: "/login/first/otp/send",
  LOGIN: "/login"
} as const;

// validation 関係
export const PASSWORD_REGEX =/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!-/:-@[-`{-~])[a-zA-Z0-9!-/:-@[-`{-~]{6,20}$/;
export const INVALID_MESSAGE: string = "INVALID";

// session 関係
export const SESSION_TTL_SEC: number = 60 * 30;
export const SESSION_TTL_MS: number = SESSION_TTL_SEC * 1000;
export const SESSION_TTL_TMP_SEC: number = 60 * 15;
export const SESSION_TTL_TMP_MS: number = SESSION_TTL_TMP_SEC * 1000;
export const SESSION_THRESHOLD_SEC: number = 60 * 5;

// csrf 関係
export const CSRF_TTL_SEC: number = 60 * 30;
export const CSRF_TTL_TMP_SEC: number = 60 * 15;

// login 関係
export const LOGIN_MAX_FAIL: number = 5;
export const LOGIN_DURATION_MS = 30 * 60 * 1000;
export const OTP_MAX_FAIL: number = 5;
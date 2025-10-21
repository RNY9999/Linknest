import { ErrorMap } from "@types";

export const Environment = {
  DEV: 'development',
  STG: 'staging',
  PROD: 'production',
};

export const Cookies = {
  COOKIE_NAME_ADMIN_SESSION: "ln_admin_sid"
}

export const ErrorResponseMappings: ErrorMap = {
  401: {
    "UNAUTHORIZED": {
      "code": "UNAUTHORIZED",
      "message": "セッションが無効です。",
      "nextPath": "/login"
    },
  },
  500: {
    "CSRF_ISSUANCE_FAILED": {
      "code": "CSRF_ISSUANCE_FAILED",
      "message": "Cannot issue CSRF"
    },
    "LN_ADMIN_SID_ISSUANCE_FAILED": {
      "code": "LN_ADMIN_SID_ISSUANCE_FAILED",
      "message": "Cannot issue ln_admin_sid"
    },
    "INTERNAL_SERVER_ERROR": {
      "code": "INTERNAL_SERVER_ERROR",
      "message": "現在、サーバーエラーが発生しています。\nお手数ですが、一定時間経過後に再度ログインをお願いします。"
    }
  }
}
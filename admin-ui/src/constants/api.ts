// linknest api エンドポイントに関する定数
export const API_BASE_URL = process.env.NEXT_PUBLIC_LINKNEST_API_SERVER_BASE_URL;

export const apiEndpoint = {
  ADMIN_SESSION: '/api/admin/session',
  ADMIN_SESSION_REFRESH: '/api/admin/session/refresh',
  ADMIN_LOGIN: '/api/admin/session',
  ADMIN_LOGOUT: '/api/admin/session',
  ADMIN_REGISTER: '/api/admin/admins',
  ADMIN_OTP_SEND: '/api/admin/admins/otp',
  ADMIN_OTP_VERIFY: '/api/admin/admins/otp',
  ADMIN_GET_OTP_EXPIRES_AT: '/api/admin/admins/otp',
} as const;
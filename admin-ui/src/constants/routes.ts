// liknest 遷移URL

export const routes = {
  LOGIN: '/login',
  TOP: '/top',
  OTP_SEND: '/login/first/otp/send',
  OTP_VERIFY: '/login/first/otp/verify',
  OTP_COMPLETE: '/login/first/completed',
  SESSION_ERROR: '/error/session',
  SERVER_ERROR: '/error/server',
  OTP_MAX_ERROR: '/error/otp-max-request',
  REGISTER_COMPLETED: '/register/completed',
  ADMINS: '/admins',
  OPTIONS: '/options'
} as const;
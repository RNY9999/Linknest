// linknest api エンドポイントに関する定数
export const API_BASE_URL = process.env.NEXT_PUBLIC_LINKNEST_API_SERVER_BASE_URL;

export const apiEndpoint = {
  ADMIN_SESSION: '/api/admin/session',
  ADMIN_LOGIN: '/api/admin/login',
} as const;
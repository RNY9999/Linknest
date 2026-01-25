import axios from "axios";
import { getCsrfToken, setCsrfToken, clearCsrfToken } from "./security/csrfStore";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_LINKNEST_API_SERVER_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  },
  withCredentials: true,
});

// リクエスト前：メモリの CSRF をヘッダにつける
apiClient.interceptors.request.use((config) => {
  // ヒープ領域に保存されている csrfToken を取得
  const token = getCsrfToken();
  // csrfToken が存在する場合
  if (token) {
    // config.headers に config.headers 存在しない場合は {} を入れる
    config.headers = config.headers ?? {};
    // config.headers "x-csrf-token" に token を入れる
    config.headers["x-csrf-token"] = token;
  }
  return config;
});

// レスポンス後：meta.csrfToken があれば上書き（ローテーション対応）
apiClient.interceptors.response.use(
  (res) => {
    const token = res.data?.meta?.csrfToken;
    if (typeof token === "string" && token.length > 0) {
      setCsrfToken(token);
    }
    return res;
  },
  (err) => {
    // セッション無効などでログアウト扱いにするならここでクリアも可
    // if (err?.response?.status === 401) clearCsrfToken();
    return Promise.reject(err);
  }
);
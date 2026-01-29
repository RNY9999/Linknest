import { API_BASE_URL, apiEndpoint } from "@/constants/api";
import { routes } from "@/constants/routes";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * 管理者セッション検証関数
 * ・(protected)/layout.tsx から呼ばれる前提
 * ・未ログイン時は redirect で処理を中断する
 * 
 * ▼処理概要
 * 1. baseUrl + /api/admin/session へ GET で管理者セッション確認APIを叩く
 *  ※baseUrlが取得できない場合はサーバエラー画面へ遷移
 * 2. 401の場合はセッションエラー画面, それ以外はサーバエラー画面へリダイレクト
 * 3. セッションが有効な場合は adminStatus を返却
 *  ※3はまだAPI側で未実装
 */

type AdminSessionResponse = {
  data: {
    valid: boolean,
    adminStatus: number
  };
};
export const requireAdminSession = async (): Promise<AdminSessionResponse> => {
  console.log("[lib_auth]: START => requireAdminSession");
  const isDebug = process.env.NEXT_PUBLIC_IS_DEBUG === "DEBUG_MODE";
  if (isDebug) return  { data: { valid: true, adminStatus: 1} };
  // 1. baseUrl + /api/admin/session へ GET で管理者セッション確認APIを叩く
  const baseUrl = API_BASE_URL;
  if (!baseUrl) {
    redirect(routes.SERVER_ERROR);
  };

  const cookieStore = await cookies();
  let res: Response;

  try {
    console.log('[lib_auth]: fetch');
    res = await fetch(baseUrl + apiEndpoint.ADMIN_SESSION, {
      method: "GET",
      headers: {
        Cookie: cookieStore.toString(),
      },
      cache: "no-store",
    });
  } catch (error) {
    console.log(error);
    console.log("[lib_auth]: END => requireAdminSession");
    redirect(routes.SERVER_ERROR);
  }

  // 2. 401の場合はセッションエラー画面, それ以外はサーバエラー画面へリダイレクト
  if (!res.ok) {
    if (res.status === 401) {
      console.log('[lib_auth]: 管理者セッション => 401');
      console.log("[lib_auth]: END => requireAdminSession");
      redirect(routes.SESSION_ERROR);
    }
    console.log('[lib_auth]: 管理者セッション => 500: サーバエラー');
    console.log("[lib_auth]: END => requireAdminSession");
    redirect(routes.SERVER_ERROR);
  };

  // 3. セッションが有効な場合は adminStatus を返却
  const resData = await res.json();
  if (
    typeof resData !== "object" || resData === null
    || typeof resData.success !== "boolean"
    || typeof resData.data?.admin?.adminStatus !== "number"
  ) {
    console.log("[lib_auth]: END => requireAdminSession");
    redirect(routes.SERVER_ERROR);
  }

  if (resData.success === true && typeof resData.data?.admin?.adminStatus === 'number') {
    // サーバから取得で来た number を返却 adminStatus をチェックする処理は別関数へ責務分離
    console.log("[lib_auth]: END => requireAdminSession");
    return { data: { valid: true, adminStatus: resData.data?.admin?.adminStatus } };
  }
  console.log("[lib_auth]: END => requireAdminSession");
  redirect(routes.SERVER_ERROR);
};
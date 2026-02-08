import Link from "next/link";
import styles from "./login.module.css";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import LoginForm from "./_components/LoginForm";
import { API_BASE_URL, apiEndpoint } from "@/constants/api";
import { routes } from "@/constants/routes";
import { AdminStatuses } from "@/constants/status";

type GetAdminSessionResponse = {
  success: boolean,
  code: string,
  message: string,
  data: {
    valid: boolean,
    expiresAt: string,
    admin: {
      adminStatus: number,
      id: number,
      email: string,
      displayName: string
    }
  },
  meta: object,
  requestId: string,
  timestamp: string
};

const LoginPage = async () => {
  const cookieStore = await cookies();
  let json: GetAdminSessionResponse | false = false;
  console.log(cookieStore.toString());

  /**
   * ログインページ遷移時・セッションチェック
   * 
   * ▼ 処理概要
   * 1. 管理者ログインチェックAPIをfetchで取得
   * 2. 成功(200)かつ adminStatus = 3 の場合は /top へリダイレクト
   * 3. エラー時などは何もしない
   */
  try {
    const res = await fetch(API_BASE_URL+apiEndpoint.ADMIN_SESSION, {
      method: "GET",
      headers: {
        // サーバ側で受け取った Cookie を、そのままバックエンドへ転送
        Cookie: cookieStore.toString(),
      },
      cache: "no-store", // セッション系は必須
    });
    json = await res.json();
  } catch {
    // 何もしない
  };

  if (json && typeof json === 'object') {
    const adminStatus = json?.data?.admin?.adminStatus;
    if (adminStatus === AdminStatuses.REGISTER) {
      redirect(routes.TOP);
    }
  }

  return (
    <div className={styles.login}>
      <h1 className={styles.login__title}>ログイン</h1>
      <LoginForm />
      <hr className={styles.login__hr} />
      <div className={styles.toRegister}>
        <p className={styles.toRegister__sentence}>
          アカウントをお持ちでないですか？
        </p>
        <Link href="/register" className={styles.toRegister__link}>
          新規登録はこちら
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;

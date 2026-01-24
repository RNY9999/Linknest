import Link from 'next/link';
import styles from './login.module.css';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import LoginForm from './_components/LoginForm';

const LoginPage = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_LINKNEST_API_SERVER_BASE_URL;
  const cookieStore = await cookies();
  console.log(cookieStore.toString());

  // セッション確認（バックエンドへ）
  if(process.env.NEXT_PUBLIC_IS_DEBUG) {
    console.log('DEBUG_MODE: ON');
    cookieStore.set('ln_admin_sid', 'DEBUG_MODE_ON');
    console.log(cookieStore.get('ln_admin_sid'));
    if (cookieStore.get('ln_admin_sid')) redirect("/top");
  } else {
    const res = await fetch(`${baseUrl}/api/admin/session`, {
      method: "GET",
      headers: {
        // サーバ側で受け取った Cookie を、そのままバックエンドへ転送
        Cookie: cookieStore.toString(),
      },
      cache: "no-store", // セッション系は必須
    });

    // セッション有効なら TOP へ
    if (res.ok) {
      redirect("/top");
    }
  }
  return(
    <div className={styles.login}>
      <h1 className={styles.login__title}>ログイン</h1>
      <LoginForm />
      <hr className={styles.login__hr}/>
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
}

export default LoginPage;
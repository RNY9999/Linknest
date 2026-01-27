import { cookies } from 'next/headers';
import { redirect } from "next/navigation";
import LoginFirstOtpSend from './_components/loginFirstOtpSend';

/**
 * 初回ログイン・OTP送信確認画面
 * 
 * 1. 保存してある cookies を管理者ログインチェックAPIを叩く（サーバコンポーネントのためfetchで叩く）
 * 2. セッションが無効の場合はセッションエラー画面へ、有効な場合はクライアントコンポーネントへ
 */
export const LoginFirstOtpSendPage = async () => {
  // api 送信先の baseUrl, ブラウザに保存されている cookies を取得
  const baseUrl = process.env.NEXT_PUBLIC_LINKNEST_API_SERVER_BASE_URL;

  if (!baseUrl) {
    redirect('/error/server');
  }

  const cookieStore = await cookies();

  // 1. 保存してある cookies を管理者ログインチェックAPIを叩く（サーバコンポーネントのためfetchで叩く）
  // no-storeはresponseをサーバ、中間サーバなどに保存させないために指定
  const res = await fetch(`${baseUrl}/api/admin/session`, {
    headers: {
      Cookie: cookieStore.toString(),
    },
    cache: "no-store"
  });

  // 2. セッションが無効の場合はセッションエラー画面へ、有効な場合はクライアントコンポーネントへ

  // セッションが無効
  if (!res.ok) {
    // 401 : セッションエラー
    if (Number(res.status) === 401) {
      redirect('/error/session');
    }
    // 401以外 : サーバーエラー
    redirect('/error/server');
  }

  // セッションが有効
  return <LoginFirstOtpSend />;
};

export default LoginFirstOtpSendPage;
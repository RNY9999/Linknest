'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from '../login.module.css';
import { apiClient } from "@/lib/apiClient";

// TODO: Typeファイルはまとめて別ファイルで管理
type LoginFormValues = {
  email: string;
  password: string;
};

const LoginForm = () => {
  const [values, setValues] = useState<LoginFormValues>({
    email: "",
    password: "",
  });

  const router = useRouter();
  

  // ログインボタン活性・非活性の制御
  const isValid = values.email.trim() !== "" && values.password.trim() !== "";

  /**
   * 処理概要
   * 1. e.target から name, value を分割代入
   * 2. useState の setValues にて prev = 直前の状態 + [name] : value を代入することで、onChangeイベントで受け取った値のみ更新
   * @param e - リアクトイベント
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value} = e.target;

    setValues((prev) => {
      return {
        ...prev,
        [name]: value,
      }
    });
  }

  /**
   * 処理概要
   * 1. preventDefault()でフォームのデフォルト動作をキャンセル
   * 2. 念のため isValid を確認し true の場合は ログインapi を叩く
   * @param e リアクトイベント
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(values);

    // ログイン処理（isValidを確認する）
    if (!isValid) return;

    // 開発環境の場合
    // POST: http://localhost:3000/api/admin/session
    console.log('endpointへデータ送信');
    console.log(process.env.NEXT_PUBLIC_LINKEST_API_SERVER_BASE_URL);

    try {
      const res = await apiClient.post("/api/admin/session", {
        email: values.email,
        password: values.password
      })
  
      const nextPath = res.data?.data?.nextPath;
      router.push(nextPath);
    } catch(error: any) {
      console.log(error?.response?.data?.message);
    }
  }

  return (
    <form className={styles.login__form} onSubmit={handleSubmit}>
      <div className={styles.login__field}>
        <label htmlFor="email" className={styles.login__label}>
          ID（メールアドレス）
        </label>
        <input
          id="email" 
          name="email"
          type="string"
          className={styles.login__input}
          value={values.email}
          onChange={handleChange}
          required 
        />
      </div>
      <div className={styles.login__field}>
        <label htmlFor="password" className={styles.login__label}>
          パスワード
        </label>
        <Link href="/forgat-password" className={styles.login__fieldLink}>
          パスワードを忘れた方はこちら
        </Link>
        <input
          id="password" 
          name="password"
          type="password"
          className={styles.login__input}
          value={values.password}
          onChange={handleChange}
          required 
        />
      </div>
      <button className={styles.login__button} type="submit" disabled={!isValid}>
        ログイン
      </button>
    </form>
  )
}

export default LoginForm;


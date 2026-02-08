'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from '../login.module.css';
import { apiClient } from "@/lib/apiClient";
import { formatIsoToJstTime } from "@/lib/date/formatJst";
import { checkAxiosError } from "@/lib/error";
import { routes } from "@/constants/routes";
import { FormSubmit } from "@/components/Form";

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
  const [errorMessage, setErrorMessage] = useState<string>("");

  const router = useRouter();
  

  // ログインボタン活性・非活性の制御
  const isValid = values.email.trim() !== "" && values.password.trim() !== "";
  // エラーフィールドの表示非表示
  const isError = errorMessage !== '';

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

    console.log('endpointへデータ送信');
    console.log(process.env.NEXT_PUBLIC_LINKNEST_API_SERVER_BASE_URL);

    try {
      const res = await apiClient.post("/api/admin/session", {
        email: values.email,
        password: values.password
      })
  
      const nextPath = res.data?.data?.nextPath;
      const data = res.data?.data;

      // nextPath によって sessionStorage に保存する内容を分岐
      switch (nextPath) {
        case '/top':
          sessionStorage.setItem('email', data?.admin?.email);
          sessionStorage.setItem('displayName', data?.admin?.displayName);
          break;
        case '/login/first/otp/send':
          sessionStorage.setItem('otpDeliveryAddress', data?.otpDeliveryAddress);
          break;
      }
      router.push(nextPath);
    } catch(error) {
      if (!checkAxiosError(error)) return router.replace(routes.SERVER_ERROR);
      const errorMessage: string = error?.response?.data?.message ?? "";
      // details.retryAfterAtが存在する際の処理
      if (error?.response?.data?.details?.retryAfterAt) {
        console.log("in");
        const replaceWord = "{retryTime}";
        const retryTime = formatIsoToJstTime(error?.response?.data?.details?.retryAfterAt);
        const updateMessage = errorMessage.replace(replaceWord, retryTime);
        setErrorMessage(updateMessage);
      } else {
        setErrorMessage(errorMessage);
      }
    }
  }

  const closeErrorField = () => {
    setErrorMessage('');
  }

  return (
    <form className={styles.login__form} onSubmit={handleSubmit}>
      <div className={isError ? styles.error__field : styles.error__filed_hidden}>
        <button className={isError ? styles.error__close : styles.error__close_hidden} type="button" onClick={closeErrorField}></button>
        <p className={styles.error__text}>
          {errorMessage}
        </p>
      </div>
      <div className={styles.login__field}>
        <label htmlFor="email" className={styles.login__label}>
          ID（メールアドレス）
        </label>
        <input
          id="email" 
          name="email"
          type="text"
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
        <Link href="/forgot-password" className={styles.login__fieldLink}>
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
      <FormSubmit
        disabled={!isValid}
      >
        ログイン
      </FormSubmit>
    </form>
  )
}

export default LoginForm;


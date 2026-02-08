"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./register.module.css";
import {
  Form,
  FormError,
  FormField,
  FormInput,
  FormSubmit,
} from "@/components/Form";
import Link from "next/link";
import { routes } from "@/constants/routes";
import { emailSchema, passwordSchema } from "@/schemas";
import { checkAxiosError } from "@/lib/error";
import { apiClient } from "@/lib/apiClient";
import { apiEndpoint } from "@/constants/api";

const RegisterPage = () => {
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [emailIsValid, setEmailIsValid] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [passwordIsValid, setPasswordIsValid] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  
  const isValid = emailIsValid && passwordIsValid;
  const resetEmailError = () => {
    setEmailError("");
  };
  const resetPasswordError = () => {
    setPasswordError("");
  };
  const emailErrorTimerRef = useRef<number | null>(null);
  const passwordErrorTimerRef = useRef<number | null>(null);

  const emailId = "email";
  const passwordId = "password";
  const maxEmailLength = 150; // From上で入力可能な数
  const maxPasswordLength = 50; // From上で入力可能な数

  const router = useRouter();

  /**
   * 仮登録
   *
   * ▼ 処理概要
   * 1. 管理者アカウント新規登録APIを叩いて Response により処理分岐
   * → [201] nextPath へ遷移
   * → [400] BAD_REQUEST → サーバーエラー？
   * → [409] エラー文言をページ内で表示※エラー文はAPI参照
   * → [500] サーバエラー画面へ遷移
   * @param e
   * @returns
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid) return;

    try {
      const sendData = {
        email: email,
        password: password,
      };
      const res = await apiClient.post(apiEndpoint.ADMIN_REGISTER, sendData);

      // → [201] nextPath へ遷移
      const nextPath = res.data?.data?.nextPath;
      router.replace(nextPath ?? routes.REGISTER_COMPLETED);
    } catch (error) {
      // Axiosエラーか同課の判定
      if (!checkAxiosError(error)) {
        router.replace(routes.SERVER_ERROR);
        return;
      }

      const status = error.response?.status; // エラーステータス
      const message = error.response?.data?.message; // エラーメッセージ

      // 何らかの理由（ネットワークエラーなど）で status が取得できない場合はサーバエラー
      if (!status) {
        router.replace(routes.SERVER_ERROR);
        return;
      }

      // TODO エラーステータスをマジックナンバーのように使用してるので後でどこかでまとめた方がいいかも
      switch (status) {
        // → [400] BAD_REQUEST → サーバーエラー？
        case 400:
          router.replace(routes.SERVER_ERROR);
          return;
        // → [409] エラー文言をページ内で表示※エラー文はAPI参照
        case 409:
          if(!message) {
            router.replace(routes.SERVER_ERROR);
            return;
          }
          setErrorMessage(message);
          return;
        // → [500] サーバエラー画面へ遷移
        // default → サーバエラー
        case 500:
        default:
          router.replace(routes.SERVER_ERROR);
          return;
      }
    }
  };

  /**
   * 入力値のセット＆バリデーション
   *
   * ▼ 処理概要
   * 1. useRefに保存されている .current が存在する場合 window.clearTimeout で setTimeOut をストップする（ユーザが入力中の間はエラーメッセージは出さない）
   * 2. 入力処理 email は前後の空白を trim, password はそのまま setState する
   * 3. value.length === 0 の場合は エラーメッセージを即削除してリターン※後続の処理にはいく必要がない
   * 4. useStateの値を使うと一つ前の値が取れるので, e.target.value を使用して safeParse※例外エラーをはかない
   * 5. response.success === true の場合は エラーメッセージを即削除して明示的にリターン※今後後続の処理が追加されてもいかない
   * 6. response.success === false の場合は setTimeOut で1秒の猶予を持たせて setState でエラーメッセージを入力
   * @param e
   * @returns
   */
  const handleOnchange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.id;
    const value = e.target.value;

    switch (id) {
      case emailId: {
        // 入力があった場合、まずエラー文を消す
        resetEmailError();
        // 1. useRefに保存されている .current が存在する場合 window.clearTimeout で setTimeOut をストップする（ユーザが入力中の間はエラーメッセージは出さない）
        if (emailErrorTimerRef.current) {
          window.clearTimeout(emailErrorTimerRef.current);
        }

        // 2. 入力処理 email は前後の空白を trim, password はそのまま setState する
        if (value.length <= maxEmailLength) {
          setEmail(value.trim());
        }

        // 3. value.length === 0 の場合は エラーメッセージを即削除してリターン※後続の処理にはいく必要がない
        if (value.length === 0) {
          setEmailIsValid(false);
          return resetEmailError();
        }
        // 4. useStateの値を使うと一つ前の値が取れるので, e.target.value を使用して safeParse※例外エラーをはかない
        const result = emailSchema.safeParse(value);

        // 5. response.success === true の場合は エラーメッセージを即削除して明示的にリターン※今後後続の処理が追加されてもいかない
        if (result.success) {
          setEmailIsValid(true);
          return resetEmailError();
        }

        // 6. response.success === false の場合は setTimeOut で1秒の猶予を持たせて setState でエラーメッセージを入力
        if (!result.success) {
          setEmailIsValid(false);
          emailErrorTimerRef.current = window.setTimeout(() => {
            setEmailError(result.error?.issues[0].message);
          }, 1000);
        }
        break;
      }
      case passwordId: {
        // 入力があった場合、まずエラー文を消す
        resetPasswordError();
        // 1. useRefに保存されている .current が存在する場合 window.clearTimeout で setTimeOut をストップする（ユーザが入力中の間はエラーメッセージは出さない）
        if (passwordErrorTimerRef.current) {
          window.clearTimeout(passwordErrorTimerRef.current);
        }

        // 2. 入力処理 email は前後の空白を trim, password はそのまま setState する
        if (value.length <= maxPasswordLength) {
          console.log(typeof value);
          setPassword(value);
        }

        // 3. value.length === 0 の場合は エラーメッセージを即削除してリターン※後続の処理にはいく必要がない
        if (value.length === 0) {
          setPasswordIsValid(false);
          return resetPasswordError();
        }
        // 4. useStateの値を使うと一つ前の値が取れるので, e.target.value を使用して safeParse※例外エラーをはかない
        const result = passwordSchema.safeParse(value);

        // 5. response.success === true の場合は エラーメッセージを即削除して明示的にリターン※今後後続の処理が追加されてもいかない
        if (result.success) {
          setPasswordIsValid(true);
          return resetPasswordError();
        }
        // 6. response.success === false の場合は setTimeOut で1秒の猶予を持たせて setState でエラーメッセージを入力
        if (!result.success) {
          setPasswordIsValid(false);
          passwordErrorTimerRef.current = window.setTimeout(() => {
            setPasswordError(result.error?.issues[0].message);
          }, 1000);
        }
        break;
      }
      default:
        // email, password以外の場合は何もしない
        break;
    }
  };
  const closeErrorField = () => {
    setErrorMessage("");
  };
  return (
    <div className={styles.register}>
      <h1 className={styles.register__title}>新規登録</h1>
      <FormError
        errorMessage={errorMessage}
        closeErrorField={closeErrorField}
      />
      <Form onSubmit={handleSubmit}>
        <div className={styles.register__inputField}>
          <FormField label="ID（メールアドレス）" htmlFor="email">
            <FormInput
              type="text"
              id="email"
              value={email}
              onChange={handleOnchange}
              className={emailError ? "form__input--has-error" : ""}
            />
          </FormField>
          <p
            className={`${styles.register__text} ${styles["register__text--error"]}`}
          >
            {emailError}
          </p>
        </div>
        <div className={styles.register__inputField}>
          <FormField label="パスワード" htmlFor="password">
            <FormInput
              type="password"
              id="password"
              value={password}
              onChange={handleOnchange}
              isPassword={true}
              className={passwordError ? "form__input--has-error" : ""}
            />
          </FormField>
          <p
            className={`${styles.register__text} ${styles["register__text--error"]}`}
          >
            {passwordError}
          </p>
          <p className={styles.register__text}>
            半角英数字と記号を組み合わせてください。
            <br />
            6文字以上20文字以下で設定してください。
            <br />
          </p>
        </div>
        <FormSubmit disabled={!isValid}>仮登録</FormSubmit>
      </Form>
      <hr className={styles.register__hr} />
      <div className={styles.register__toLogin}>
        <p className={styles.register__text}>アカウントをお持ちですか？</p>
        <Link href={routes.LOGIN} className={styles.register__link}>
          ログインはこちら
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;

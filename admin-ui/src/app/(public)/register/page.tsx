"use client";

import React, { useEffect, useRef } from "react";
import styles from "./register.module.css";
import {
  Form,
  FormError,
  FormField,
  FormInput,
  FormSubmit,
} from "@/components/Form";
import { useState } from "react";
import Link from "next/link";
import { routes } from "@/constants/routes";
import { emailSchema, passwordSchema } from "@/schemas";

const RegisterPage = () => {
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
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
  const isValid = true;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {};
  
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
        if (value.length === 0) return resetEmailError();

        // 4. useStateの値を使うと一つ前の値が取れるので, e.target.value を使用して safeParse※例外エラーをはかない
        const result = emailSchema.safeParse(value);

        // 5. response.success === true の場合は エラーメッセージを即削除して明示的にリターン※今後後続の処理が追加されてもいかない
        if (result.success) return resetEmailError();

        // 6. response.success === false の場合は setTimeOut で1秒の猶予を持たせて setState でエラーメッセージを入力
        if (!result.success) {
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
        if (value.length === 0) return resetPasswordError();

        // 4. useStateの値を使うと一つ前の値が取れるので, e.target.value を使用して safeParse※例外エラーをはかない
        const result = passwordSchema.safeParse(value);

        // 5. response.success === true の場合は エラーメッセージを即削除して明示的にリターン※今後後続の処理が追加されてもいかない
        if (result.success) return resetPasswordError();

        // 6. response.success === false の場合は setTimeOut で1秒の猶予を持たせて setState でエラーメッセージを入力
        if (!result.success) {
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

"use client";

import React from "react";
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

const RegisterPage = () => {
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const isValid = true;
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {};
  const handleOnchange = (e: React.ChangeEvent<HTMLInputElement>) => {};
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
            <FormInput id="email" value={email} onChange={handleOnchange} />
          </FormField>
        </div>
        <div className={styles.register__inputField}>
          <FormField label="パスワード" htmlFor="password">
            <FormInput
              id="password"
              value={password}
              onChange={handleOnchange}
            />
          </FormField>
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

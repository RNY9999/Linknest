"use client";

import React, { useEffect } from "react";
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
import {z} from 'zod';

const RegisterPage = () => {
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [emailError, setEmailError] = useState<string>('');
  const [passwordlError, setPasswordError] = useState<string>('');

  const isValid = true;
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {};
  const handleOnchange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const id = e.target.id;
    const value = e.target.value;
    const emailId = 'email';
    const passwordId = 'password';
    const maxEmailLength = 150; // From上で入力可能な数
    const maxPasswordLength = 50; // From上で入力可能な数

    switch (id) {
      case emailId:
        if (value.length <= maxEmailLength) {
          setEmail(value.trim());
        }
        break;
      case passwordId:
        if (value.length <= maxPasswordLength) {
          setPassword(value);
        }
        break;
      default:
        // email, password以外の場合は何もしない
        break;
    }
  };
  const closeErrorField = () => {
    setErrorMessage("");
  };

  // email入力1秒後にバリデーションチェックを行う
  useEffect(() => {
    console.log('checkEmail');
    setTimeout(() => {
      const result = emailSchema.safeParse(email);
      console.log(result.error?.issues);
      console.log(result.error?.issues[0].message);
      if (!result.success) {
        setEmailError(result.error?.issues[0].message);
      }
    }, 1000);
  }, [email]);
  // password入力1秒後にバリデーションチェックを行う
  useEffect(() => {
    setTimeout(() => {
      passwordSchema.safeParse(password)
    }, 1000);
  }, [password]);
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
            <FormInput type="text" id="email" value={email} onChange={handleOnchange} />
          </FormField>
          {emailError}
        </div>
        <div className={styles.register__inputField}>
          <FormField label="パスワード" htmlFor="password">
            <FormInput
              type="password"
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

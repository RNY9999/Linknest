"use client";

import { useState } from "react";
import Image from "next/image";
import { login } from "@/lib/login";
import type { LoginResult } from "@/types/auth";
import styles from "./page.module.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginResult, setLoginResult] = useState<LoginResult | null>(null);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  const isLoginEnabled = email.trim().length > 0 && password.trim().length > 0;
  const hasAuthError =
    loginResult !== null && loginResult.status !== "success";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setLoginResult(null);
    try {
      const result = await login(email, password);
      setLoginResult(result);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles["login-page"]}>
      <div className={styles["login-page__content"]}>
        <div className={styles["login-page__logo-area"]}>
          <Image
            src="/images/logo/logo-symbol-color.svg"
            alt=""
            width={128}
            height={128}
          />
          <Image
            src="/images/logo/logo-title.svg"
            alt="Linknest"
            width={72}
            height={16}
          />
          <p className={styles["login-page__catch-copy"]}>
            つながりがチームを強くする
          </p>
        </div>

        <form
          className={styles["login-page__form"]}
          noValidate
          onSubmit={handleLogin}
        >
          <div className={styles["login-page__field"]}>
            <label className={styles["login-page__label"]} htmlFor="email">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              className={`${styles["login-page__input"]}${hasAuthError ? ` ${styles["--error"]}` : ""}`}
              placeholder="メールアドレスを入力する"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setLoginResult(null)}
            />
          </div>

          <div className={styles["login-page__field"]}>
            <label className={styles["login-page__label"]} htmlFor="password">
              パスワード
            </label>
            <div className={styles["login-page__password-wrapper"]}>
              <input
                id="password"
                type={isPasswordVisible ? "text" : "password"}
                className={`${styles["login-page__input"]}${hasAuthError ? ` ${styles["--error"]}` : ""}`}
                placeholder="パスワードを入力する"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setLoginResult(null)}
              />
              <button
                type="button"
                className={styles["login-page__eye-button"]}
                aria-label={
                  isPasswordVisible ? "パスワードを非表示" : "パスワードを表示"
                }
                onClick={togglePasswordVisibility}
              >
                <Image
                  src={
                    isPasswordVisible
                      ? "/icons/auth/eye-close.svg"
                      : "/icons/auth/eye-open.svg"
                  }
                  alt=""
                  width={24}
                  height={24}
                />
              </button>
            </div>
          </div>

          {loginResult !== null && (
            <p
              className={`${styles["login-page__result-message"]} ${loginResult.status === "success" ? styles["--success"] : styles["--error"]}`}
            >
              {loginResult.message}
            </p>
          )}

          <button
            type="submit"
            className={`${styles["login-page__login-button"]}${(!isLoginEnabled || isLoading) ? ` ${styles["--disabled"]}` : ""}`}
            disabled={!isLoginEnabled || isLoading}
          >
            <span className={styles["login-page__login-button-content"]}>
              {isLoading && (
                <span
                  className={styles["login-page__login-spinner"]}
                  aria-hidden="true"
                />
              )}
              ログイン
            </span>
          </button>
        </form>

        <a href="#" className={styles["login-page__forgot-link"]}>
          パスワードをお忘れですか？
        </a>

        <div className={styles["login-page__divider"]}>
          <span className={styles["login-page__divider-line"]} />
          <span className={styles["login-page__divider-text"]}>または</span>
          <span className={styles["login-page__divider-line"]} />
        </div>

        <p className={styles["login-page__register-text"]}>
          アカウントをお持ちでない方は{" "}
          <a href="#" className={styles["login-page__register-link"]}>
            新規登録
          </a>
        </p>
      </div>

      <footer className={styles["login-page__footer"]}>
        <a href="#" className={styles["login-page__footer-link"]}>
          利用規約
        </a>
        <a href="#" className={styles["login-page__footer-link"]}>
          プライバシーポリシー
        </a>
        <a href="#" className={styles["login-page__footer-link"]}>
          サポート
        </a>
      </footer>
    </main>
  );
};

export default LoginPage;

"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  const isLoginEnabled = email.trim().length > 0 && password.trim().length > 0;

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

        <form className={styles["login-page__form"]} noValidate>
          <div className={styles["login-page__field"]}>
            <label className={styles["login-page__label"]} htmlFor="email">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              className={styles["login-page__input"]}
              placeholder="メールアドレスを入力する"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                className={styles["login-page__input"]}
                placeholder="パスワードを入力する"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <button
            type="button"
            className={`${styles["login-page__login-button"]}${!isLoginEnabled ? ` ${styles["--disabled"]}` : ""}`}
            disabled={!isLoginEnabled}
          >
            ログイン
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

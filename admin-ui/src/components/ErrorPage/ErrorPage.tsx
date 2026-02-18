"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { routes } from "@/constants/routes";
import styles from "./Error.module.css";
import { apiClient } from "@/lib/apiClient";
import { apiEndpoint } from "@/constants/api";

type Props = {
  iconSrc: string;
  errorTitle: string;
  errorMessage: string;
  buttonTitle: string;
  isLogout?: boolean;
}

const ErrorPage = ({
  iconSrc,
  errorTitle,
  errorMessage,
  buttonTitle,
  isLogout,
}: Props) => {
  const router = useRouter();
  const [isHidden, setIsHidden] = useState<boolean>(false);

  const handleLogout = async () => {
    try {
      // 1. try, catch内でログアウトAPIを叩く
      await apiClient.delete(apiEndpoint.ADMIN_LOGOUT);
    } catch {
      // error自体はcatchするが、finallyで必ずログアウト
    } finally {
      // 2. 成功、失敗関係なく finally でログイン画面へ遷移
      router.replace(routes.LOGIN);
    }
  };

  const closeErrorField = () => {
    setIsHidden(true);
  };

  const handleOnClick = () => {
    if (isLogout) {
      return handleLogout();
    }
    router.replace(routes.LOGIN);
  };
  return (
    <div className={styles.error__contents}>
      <Image
        src={iconSrc}
        alt="エラーアイコン"
        width={80}
        height={80}
        className={styles.error__icon}
      />
      <h1 className={styles.error__title}>
        {errorTitle}
      </h1>
      <div
        className={
          isHidden ? styles["error__field--hidden"] : styles.error__field
        }
      >
        <button
          type="button"
          className={
            isHidden ? styles["error__close--hidden"] : styles.error__close
          }
          onClick={closeErrorField}
        />
        <p className={styles.error__text}>
          {errorMessage}
        </p>
      </div>
      <button
        type="button"
        className={styles.error__button}
        onClick={handleOnClick}
      >
        {buttonTitle}
      </button>
    </div>
  );
};

export default ErrorPage;

"use client";

import Image from "next/image";
import styles from "@/styles/modules/contents.module.css";
import { useRouter } from "next/navigation";
import { routes } from "@/constants/routes";

const LoginFirstCompletedPage = () => {
  const router = useRouter();
  const handleOnclick = () => {
    router.replace(routes.LOGIN);
  }
  return (
    <div className={styles.contents}>
      <Image
        src="/icons/status/check-circle.svg"
        alt="認証完了"
        width={80}
        height={80}
        className={styles.contents__icon}
      />
      <h1 className={styles.contents__title}>
        仮登録完了
      </h1>
      <p className={styles.contents__text}>
        管理者アカウントの仮登録が完了しました。<br/>
        下記ボタンよりログイン画面へ遷移し、ログインを行ってください。
      </p>
      <button 
        type="button"
        className={styles.contents__button}
        onClick={handleOnclick}
      >
        ログイン画面へ
      </button>
    </div>
  );
};

export default LoginFirstCompletedPage;

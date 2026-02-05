"use client";

import Image from "next/image";
import styles from "@/styles/modules/contents.module.css";
import { useRouter } from "next/navigation";
import { routes } from "@/constants/routes";

const LoginFirstCompletedPage = () => {
  const router = useRouter();
  const handleOnclick = () => {
    router.replace(routes.TOP);
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
        認証完了
      </h1>
      <p className={styles.contents__text}>
        ワンタイムパスワードの認証が完了しました。<br/>
        下記ボタンより、Linknest管理システムTOP画面へ遷移できます。
      </p>
      <button 
        type="button"
        className={styles.contents__button}
        onClick={handleOnclick}
      >
        Linknest管理システムへ
      </button>
    </div>
  );
};

export default LoginFirstCompletedPage;

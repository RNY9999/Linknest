'use client';
import Image from "next/image";
import styles from "./Toaster.module.css";
import { useEffect, useState } from "react";

type Props = {
  message: string;
};

const toasterIconUrl = "/icons/toaster/circle-check-green.svg";
const toasterCloseIconUrl = "/icons/toaster/x.svg";

const sleepFn = (fn: () => void, ms: number) => {
  const id = setTimeout(() => {
    fn();
  }, ms);
  return id;
};

const toasterDisplayMs = 500;
const toasterHiddenMs = 3000;

const Toaster = ({ message }: Props) => {
  const [toasterHidden, setToasterHidden] = useState<boolean>(true);

  const hiddenToaster = () => {
    setToasterHidden(true);
  };

  const displayToaster = () => {
    setToasterHidden(false);
  };

  useEffect(() => {
    const displayId = sleepFn(displayToaster, toasterDisplayMs);
    const hiddenId = sleepFn(hiddenToaster, toasterHiddenMs);

    return () => {
      clearTimeout(displayId);
      clearTimeout(hiddenId);
    };
  }, []);
  return (
    <div
      className={`${styles["toaster"]} ${toasterHidden ? styles["--hidden"] : ""}`}
    >
      <Image
        src={toasterIconUrl}
        alt=""
        width={24}
        height={24}
        className={styles["toaster__icon"]}
      />
      <p className={styles["toaster__message"]}>{message}</p>
      <button
        type="button"
        className={styles["toaster__close"]}
        onClick={() => setToasterHidden(true)}
      >
        <Image src={toasterCloseIconUrl} alt="" width={24} height={24} />
      </button>
    </div>
  );
};

export default Toaster;

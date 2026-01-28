'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from '../loginFirstOtpSend.module.css';

const LoginFirstOtpSend = () => {
    const keyOfOtpDeliveryAddress: string = 'otpDeliveryAddress';
    const [otpDeliveryAddress] = useState<string | null>(() => {
      return typeof window !== 'undefined'
        ? sessionStorage.getItem(keyOfOtpDeliveryAddress)
        : null;
    }
    );
    
  return(
    <div className={styles.sendOtp}>
      <h1 className={styles.sendOtp__title}>
        初回ログイン<br />
        ワンタイムパスワード送信の確認
      </h1>
      <div className={styles.sendOtp__contents}>
        <p className={styles.sendOtp__text}>
          以下メールアドレスにワンタイムパスワードを送信します。<br />
          よろしければ送信ボタンを押してください
        </p>
        <p className={styles.sendOtp__email}>
          {otpDeliveryAddress}
        </p>
      </div>
      <p className={styles.sendOtp__text}>
        ※この後、ワンタイムパスワードの入力画面に進みます<br />
        ※届かない場合は迷惑メールフォルダをご確認ください
      </p>
      <button 
        className={styles.sendOtp__button} 
        type="button"
      >
        ワンタイムパスワードを送信
      </button>
      <hr />
      <div className={styles.sendOtp__pageOption}>
        <Link href='/login' className={styles.sendOtp__link}>
          &lt;&lt; 戻る
        </Link>
        <Link href='/login' className={styles.sendOtp__link}>
          ログインはこちら
        </Link>
      </div>
    </div>
  );
}

export default LoginFirstOtpSend;
'use client';

import { useState, useEffect } from 'react';
import styles from './loginFirstOtpSend.module.css';
import { apiClient } from '@/lib/apiClient';
import { apiEndpoint } from '@/constants/api';
import { useRouter } from 'next/navigation';
import { routes } from '@/constants/routes';
import { checkAxiosError } from '@/lib/error/error';
import { sessionStorageKeys } from '@/constants/sessionStorage';

const LoginFirstOtpSendPage = () => {
  const router = useRouter();
  const [otpDeliveryAddress, setOtpDeliveryAddress] = useState('');

  // 画面に表示する email を取得するために セッション情報 を取得
  const getAdminSession = async () => {
      const res = await apiClient.get(apiEndpoint.ADMIN_SESSION)
      return res;
  }

  /**
   * 「<< 戻る」ボタン or 「ログインはこちら」ボタンを押した際の処理
   * 
   * ▼ 処理概要
   * 1. try, catch内でログアウトAPIを叩く
   * 2. 成功、失敗関係なく finally でログイン画面へ遷移
   */
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

  /**
   * 「ワンタイムパスワードを送信」ボタンを押した際の処理
   * 
   * ▼ 処理概要
   * 1. OTP送信APIを叩き nextPath, otpDeliveryAddress, expiresAt を取得し次のif文へ
   * 2. 画面表示の email と API から取得した email を比較し次のif文へ
   * ※将来画面表示用を伏字にするならこのチェックはなくす
   * 3. otpDeliveryAddress, otpExpiresAt を sessionStorage に保存し、nextPath へ遷移
   * 4. Axiosエラーかつ 401 の場合はセッションエラー画面へ遷移
   * 5. 1~4の処理でどこにも遷移していない場合はすべてサーバエラーとして処理
   */
  const handleOtpSend = async () => {
    let isRedirect = false;
    try {
      // 1. OTP送信APIを叩き nextPath, otpDeliveryAddress, expiresAt を取得し次のif文へ
      const res = await apiClient.post(apiEndpoint.ADMIN_OTP_SEND);
      
      const nextPath = res.data?.data?.nextPath;
      const otpDeliveryAddressFromApi = res.data?.data?.otpDeliveryAddress;
      const otpExpiresAt = res.data?.data?.expiresAt;
      if (
        otpDeliveryAddressFromApi
        && nextPath
        && otpExpiresAt
      ) {
        // 2. 画面表示の email と API から取得した email を比較し次のif文へ
        if (otpDeliveryAddress === otpDeliveryAddressFromApi) {
          // 3. otpDeliveryAddress, otpExpiresAt を sessionStorage に保存し、nextPath へ遷移
          sessionStorage.setItem(sessionStorageKeys.OTP_DELIVERY_ADDRESS, otpDeliveryAddressFromApi);
          sessionStorage.setItem(sessionStorageKeys.OTP_EXPIRES_AT, otpExpiresAt);
          isRedirect = true;
          router.replace(nextPath);
        }
      }
    } catch (error: unknown) {
      const isAxiosError = checkAxiosError(error);
      // 4. Axiosエラーかつ 401 の場合はセッションエラー画面へ遷移
      if (isAxiosError) {
        const errorStatus = error?.response?.status;
        if (errorStatus === 401) {
          isRedirect = true;
          router.replace(routes.SESSION_ERROR);
        }
      }
    }
    
    if (isRedirect) return;
    // 5. 1~4の処理でどこにも遷移していない場合はすべてサーバエラーとして処理
    router.replace(routes.SERVER_ERROR);
  }

  useEffect(() => {
    getAdminSession()
      .then((res) => {
        const resEmail = res.data?.data?.admin?.email;
        if(resEmail) {
          setOtpDeliveryAddress(resEmail);
        } else {
          throw new Error('[OTP送信確認画面] email 取得エラー');
        }
      }).catch(() => {
        router.replace(routes.SESSION_ERROR);
      });
  }, [router])
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
        onClick={handleOtpSend}
        type="button"
      >
        ワンタイムパスワードを送信
      </button>
      <hr />
      <div className={styles.sendOtp__pageOption}>
        <button
          className={styles.sendOtp__link}
          onClick={handleLogout} 
          type="button"
        >
          &lt;&lt; 戻る
        </button>
        <button
          className={styles.sendOtp__link}
          onClick={handleLogout} 
          type="button"
        >
          ログインはこちら
        </button>
      </div>
    </div>
  );
}

export default LoginFirstOtpSendPage;
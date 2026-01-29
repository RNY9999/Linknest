'use client';

import styles from './loginFirstOtpVerify.module.css';
const LoginFirstOtpVerifyPage = () => {
  return (
    <div className={styles.inputOtp}>
      <h1 className={styles.inputOtp__title}>
        初回ログイン<br />
        ワンタイムパスワード入力
      </h1>
      <div className={styles.inputOtp__contents}>
        <p className={styles.inputOtp__text}>
          ご登録のメールアドレス（r*****0*****@gmail.com）に<br />
          ワンタイムパスワードを送信しました。<br />
          確認の上、以下フォームにご入力ください。
        </p>
      </div>
      <div className={styles.inputOtp__expiresAt}>
        <p className={styles.inputOtp__attention}>
          有効期限は５分です
        </p>
        <p className={styles.inputOtp__timeLimit}>
          05:00
        </p>
      </div>
      <button 
        className={styles.inputOtp__button} 
        // onClick={handleOtpSend}
        type="button"
      >
        ワンタイムパスワードを認証する
      </button>
      <div className={styles.inputOtp__reTry}>
        <p className={styles.inputOtp__text}>
          メールが届かない場合や、有効期限が切れた場合、以下のリンクからワンタイムパスワードを再送信してください
        </p>
        <button
          className={styles.inputOtp__link}
          // onClick={handleLogout} 
          type="button"
        >
          ワンタイムパスワードを再送信する
        </button>
      </div>
      <hr />
      <div className={styles.inputOtp__pageOption}>
        <button
          className={styles.inputOtp__link}
          // onClick={handleLogout} 
          type="button"
        >
          &lt;&lt; 戻る
        </button>
        <button
          className={styles.inputOtp__link}
          // onClick={handleLogout} 
          type="button"
        >
          ログインはこちら
        </button>
      </div>
    </div>
  );
}

export default LoginFirstOtpVerifyPage; 
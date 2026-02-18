'use client';

import styles from '../loginFirstOtpVerify.module.css';

const OtpVerifyFrom = () => {
  return (
    <form action="">
      <input type="number" />
      <button 
        className={styles.inputOtp__button} 
        // onClick={handleOtpSend}
        type="submit"
      >
        ワンタイムパスワードを認証する
      </button>
    </form>
  );
};

export default OtpVerifyFrom;
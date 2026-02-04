"use client";

import Image from "next/image";

const LoginFirstCompletedPage = () => {
  return (
    <>
      <Image
        src="/icons/status/check-circle.svg"
        alt="認証完了"
        width={64}
        height={64}
      />
      <h1>OTP認証完了だよ！</h1>
    </>
  );
};

export default LoginFirstCompletedPage;

"use client";
import ErrorPage from "@/components/ErrorPage/ErrorPage";

const ErrorServerPage = () => {
  const errorMessage = `現在、サーバーエラーが発生しています。
  お手数ですが、一定時間経過後に再度ログインをお願いします。
  `;
  return (
    <ErrorPage
      iconSrc="/icons/status/server-error.svg"
      errorTitle="サーバーエラー"
      errorMessage={errorMessage}
      buttonTitle="ログイン画面へ"
      isLogout={true}
    />
  );
};

export default ErrorServerPage;

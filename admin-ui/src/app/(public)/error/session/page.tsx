"use client";
import ErrorPage from "@/components/ErrorPage/ErrorPage";

const ErrorSessionPage = () => {
  const errorMessage = `セッションの有効期限が切れたか、無効なアクセスです。  
お手数ですが、再度ログインを行ってください。
  `;
  return (
    <ErrorPage
      iconSrc="/icons/status/session-error.svg"
      errorTitle="セッションエラー"
      errorMessage={errorMessage}
      buttonTitle="ログイン画面へ"
      isLogout={true}
    />
  );
};

export default ErrorSessionPage;
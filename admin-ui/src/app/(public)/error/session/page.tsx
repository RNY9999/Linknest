"use client"
import { routes } from "@/constants/routes";
import Link from "next/link";

const ErrorSessionPage = () => {
  return (
    <>
      <h1>セッションエラー画面</h1>
      <p>セッションエラーです</p>
      <Link href={routes.LOGIN}>ログイン画面へ</Link>
    </>
  );
};

export default ErrorSessionPage;
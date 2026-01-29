"use client"

import Link from "next/link";
import { routes } from "@/constants/routes";

const ErrorServerPage = () => {
  return (
    <>
      <h1>サーバエラー画面</h1>
      <p>サーバエラーです</p>
      <Link href={routes.LOGIN}>ログイン画面へ</Link>
    </>
  );
};

export default ErrorServerPage;
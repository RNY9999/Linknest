import type { LoginResult } from "@/types/auth";

export async function login(
  email: string,
  password: string
): Promise<LoginResult> {
  if (process.env.NEXT_PUBLIC_API_MODE === "mock") {
    await new Promise<void>((resolve) => setTimeout(resolve, 800));

    if (email === "locked@example.com") {
      return { status: "locked", message: "アカウントを一時的に停止しています。" };
    }
    if (email === "test@example.com" && password === "password") {
      return { status: "success", message: "ログインに成功しました。" };
    }
    return {
      status: "failure",
      message: "メールアドレスまたはパスワードが正しくありません。",
    };
  }

  // TODO: 本物API連携
  throw new Error("API mode is not configured.");
}

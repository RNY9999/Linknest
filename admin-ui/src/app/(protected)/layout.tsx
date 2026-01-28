import { requireAdminSession } from "@/lib/auth/requireAdminSession";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ここで未ログイン・不正状態は redirect される
  await requireAdminSession();

  return <>{children}</>;
}
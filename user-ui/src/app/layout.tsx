import type { Metadata } from "next";
import "destyle.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Linknest",
  description: "つながりがチームを強くする",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

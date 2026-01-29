import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "AI占卜",
  description: "AI占卜陪伴MVP",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

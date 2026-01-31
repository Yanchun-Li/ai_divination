import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Soft Certainty",
  description: "Soft Certainty - Your gentle guide to inner clarity",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" data-theme="dark">
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&family=Noto+Sans+SC:wght@300;400&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

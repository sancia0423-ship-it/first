import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YouTube 中文翻译",
  description: "把公开 YouTube 视频翻成中文，查看双语字幕，并用浏览器中文语音跟读。"
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

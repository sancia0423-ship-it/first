import type { Metadata } from "next";
import "./globals.css";
import { portfolioContent } from "@/lib/portfolio-content";

export const metadata: Metadata = {
  title: portfolioContent.site.title,
  description: portfolioContent.site.description
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

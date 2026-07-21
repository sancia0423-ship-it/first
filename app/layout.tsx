import type { Metadata } from "next";
import "./globals.css";
import { personalSiteContent } from "@/lib/personal-site-content";

export const metadata: Metadata = {
  title: personalSiteContent.site.title,
  description: personalSiteContent.site.description
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

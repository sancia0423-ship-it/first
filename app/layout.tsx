import type { Metadata, Viewport } from "next";
import "./globals.css";
import { personalSiteContent } from "@/lib/personal-site-content";

const { description, siteName, subtitle, title } = personalSiteContent.site;

/** Set NEXT_PUBLIC_SITE_URL in production so shared links resolve absolutely. */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: {
    default: siteName,
    template: `%s | ${siteName}`
  },
  description,
  applicationName: siteName,
  keywords: ["AI 产品经理", "作品集", "个人网站", "AI 学习资料", "模拟面试"],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName,
    title: `${title} · ${subtitle}`,
    description
  },
  twitter: {
    card: "summary",
    title: `${title} · ${subtitle}`,
    description
  },
  robots: {
    index: true,
    follow: true
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff"
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

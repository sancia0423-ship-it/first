import type { Metadata, Viewport } from "next";
import "./globals.css";
import { personalSiteContent } from "@/lib/personal-site-content";

const { description, siteName, subtitle, title } = personalSiteContent.site;

/**
 * 首页大标题用的毛笔书法字体。
 *
 * 用 Google Fonts 的 `text=` 参数只请求标题里实际出现的那几个字 —— 完整中文
 * 字体有 3–8MB，这样切下来只有 3KB 左右。子集跟着标题文案走，所以改文案不会
 * 出现缺字。
 */
const brushFontFamily = "Ma Shan Zheng";
const brushFontUrl =
  "https://fonts.googleapis.com/css2?family=" +
  brushFontFamily.replace(/ /g, "+") +
  "&text=" +
  encodeURIComponent(personalSiteContent.home.hero.titleIntro) +
  "&display=swap";

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
      <body>
        <link href="https://fonts.gstatic.com" rel="preconnect" crossOrigin="anonymous" />
        <link href={brushFontUrl} precedence="default" rel="stylesheet" />
        {children}
      </body>
    </html>
  );
}

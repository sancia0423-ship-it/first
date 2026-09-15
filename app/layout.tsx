import type { Metadata, Viewport } from "next";
import "./globals.css";
import { personalSiteContent } from "@/lib/personal-site-content";

const { description, siteName, subtitle, title } = personalSiteContent.site;

/** Set NEXT_PUBLIC_SITE_URL in production so shared links resolve absolutely. */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

/**
 * 大标题用宋体：比黑体更正式、更克制，和这套编辑式版式相称。
 *
 * 用 Google Fonts 的 text= 参数只请求标题里实际出现的字 —— 完整中文字体有
 * 3-8MB，这样切下来约 4KB。字表跟着页面标题走，改文案不会缺字。
 */
const displayFontFamily = "Noto Serif SC";
const displayGlyphs = [
  personalSiteContent.home.hero.titleIntro,
  personalSiteContent.learning.hero.title,
  personalSiteContent.tools.hero.title,
  personalSiteContent.home.projects.kicker,
  "项目经历 提示词架构师 项目经历改写 中文翻译 模拟面试 快速准备页"
].join("");

const displayFontUrl =
  "https://fonts.googleapis.com/css2?family=" +
  displayFontFamily.replace(/ /g, "+") +
  ":wght@500&text=" +
  encodeURIComponent([...new Set(displayGlyphs)].join("")) +
  "&display=swap";

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
        <link href={displayFontUrl} precedence="default" rel="stylesheet" />
        {children}
      </body>
    </html>
  );
}

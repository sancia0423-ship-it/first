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
/**
 * 字表从内容里收，不要手写。
 *
 * 之前这里是一份写死的清单，页面上新出现的标题字（「期待你的联系」「项目展示」等）
 * 不在表里就下不到字形，浏览器悄悄退回系统黑体 —— 同一行里半宋体半黑体，
 * 看起来就是「字体不统一」。改成从实际用到的标题文案里收集，文案改了也不会再缺字。
 */
const { home, learning, tools } = personalSiteContent;
const displayGlyphs = [
  home.hero.kicker,
  home.hero.titleIntro,
  home.hero.lead,
  home.about.kicker,
  home.about.title,
  home.projects.title,
  home.contact.kicker,
  home.contact.title,
  learning.hero.title,
  learning.hero.lead,
  tools.hero.title,
  tools.feature.name,
  tools.feature.tagline,
  tools.feature.logTitle,
  // 组件里直接写死的标题与按钮文案
  "项目展示 自我介绍 主页 项目 作品 学习资料 返回 打开越语听 看怎么接入 简历下载 开发者日志",
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789?!,.—·｜/&:"
].join("");

const displayFontUrl =
  "https://fonts.googleapis.com/css2?family=" +
  displayFontFamily.replace(/ /g, "+") +
  ":wght@500&text=" +
  encodeURIComponent([...new Set(displayGlyphs)].join("")) +
  "&display=swap";

/**
 * 中文手写体，用在首屏的名字和签名上。同样用 text= 只取实际出现的字，
 * 完整字体有好几 MB，这样切下来几 KB。
 */
const handFontUrl =
  "https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&text=" +
  encodeURIComponent([...new Set("我是夏琪温暖好奇生命力welcome、")].join("")) +
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
        <link href={handFontUrl} precedence="default" rel="stylesheet" />
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { YouTubeTranslateDemo } from "@/components/youtube-translate-demo";

export const metadata: Metadata = {
  title: "YouTube 中文翻译",
  description: "读取公开视频字幕，生成中文字幕、章节速览，并可对内容提问。"
};

export default function YouTubeToolPage() {
  return (
    <main className="page-shell">
      <SiteHeader />

      <section id="top">
        <span className="eyebrow">工具</span>
        <h1 className="page-title">YouTube 中文翻译</h1>
        <p className="hero-copy section">
          把公开视频的字幕读出来、翻成中文，可以搜索、点句跳转、存成笔记。
          填入自己的 API key 之后，还能生成章节速览、就内容提问、给自己出测验题。
        </p>

        <div className="button-row section portfolio-link-row">
          <Link className="ghost-button" href="/tools">
            返回工具列表
          </Link>
        </div>
      </section>

      <section id="tool">
        <YouTubeTranslateDemo />
      </section>
    </main>
  );
}

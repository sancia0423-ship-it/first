import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { YouTubeTranslateDemo } from "@/components/youtube-translate-demo";

export default function YouTubePage() {
  return (
    <main className="page-shell">
      <SiteHeader />

      <section className="hero-panel">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">YouTube Translate Agent</span>
            <h1 className="hero-title hero-title-compact">边看 YouTube，边拿到中文字幕和中文跟读。</h1>
            <p className="hero-copy">
              这一页把公开视频字幕、中文翻译、播放器时间轴和浏览器语音串成了一条完整体验链路。你贴一个链接进来，就能得到同步双语字幕，还可以让浏览器用中文语音跟着当前内容读出来。
            </p>

            <div className="hero-metrics hero-metrics-compact">
              <div className="metric-tile">
                <p className="metric-label">输入源</p>
                <p className="metric-value">YouTube</p>
                <p className="metric-note">优先读取公开字幕轨道</p>
              </div>
              <div className="metric-tile">
                <p className="metric-label">输出</p>
                <p className="metric-value">双语</p>
                <p className="metric-note">中文字幕 + 原文对照 + SRT</p>
              </div>
              <div className="metric-tile">
                <p className="metric-label">额外能力</p>
                <p className="metric-value">中文跟读</p>
                <p className="metric-note">浏览器本地 TTS 同步朗读</p>
              </div>
            </div>

            <div className="button-row section">
              <Link className="ghost-button" href="/">
                返回首页
              </Link>
            </div>
          </div>

          <div className="panel search-panel">
            <h2 className="panel-title">适合怎么用</h2>
            <ul className="stack-list">
              <li>看英文技术视频时，直接开同步中文字幕，减少暂停次数。</li>
              <li>遇到节奏快的视频，可以打开中文跟读，把原声降一点。</li>
              <li>如果你只是想保存字幕，也可以直接下载中文 `.srt`。</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <YouTubeTranslateDemo />
      </section>
    </main>
  );
}

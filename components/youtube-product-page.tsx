import { SiteHeader } from "@/components/site-header";
import { YouTubeTranslateDemo } from "@/components/youtube-translate-demo";

export function YouTubeProductPage() {
  return (
    <main className="page-shell">
      <SiteHeader />

      <section className="hero-panel">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">YouTube Video Translator</span>
            <h1 className="hero-title hero-title-compact">把 YouTube 视频翻成中文，还能边看边听。</h1>
            <p className="hero-copy">
              贴入一个带公开字幕的 YouTube 链接，就能拿到中文字幕、原文对照、可下载字幕文件，以及浏览器里的中文朗读。
            </p>

            <div className="hero-metrics hero-metrics-compact">
              <div className="metric-tile">
                <p className="metric-label">输入</p>
                <p className="metric-value">YouTube 链接</p>
                <p className="metric-note">支持 watch、shorts 和 youtu.be</p>
              </div>
              <div className="metric-tile">
                <p className="metric-label">输出</p>
                <p className="metric-value">中文字幕</p>
                <p className="metric-note">原文对照 + SRT 下载</p>
              </div>
              <div className="metric-tile">
                <p className="metric-label">语音</p>
                <p className="metric-value">中文朗读</p>
                <p className="metric-note">用浏览器本地中文语音跟读</p>
              </div>
            </div>
          </div>

          <div className="panel search-panel">
            <h2 className="panel-title">怎么用</h2>
            <ul className="stack-list">
              <li>看英文视频时，直接打开中文字幕，减少频繁暂停。</li>
              <li>想练听力时，可以保留原文对照，再打开中文朗读辅助理解。</li>
              <li>如果只想存字幕，也可以直接下载中文 `.srt` 文件。</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section" id="translator">
        <YouTubeTranslateDemo />
      </section>
    </main>
  );
}

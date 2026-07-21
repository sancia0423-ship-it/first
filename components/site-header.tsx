import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand-lockup" href="/">
        <span className="brand-mark">YT</span>
        <span>
          <strong className="brand-title">YouTube 中文翻译</strong>
          <span className="brand-subtitle">中文字幕、原文对照、中文朗读</span>
        </span>
      </Link>

      <nav className="header-nav" aria-label="Primary">
        <Link className="header-link" href="/">
          YouTube 翻译
        </Link>
        <Link className="header-link" href="/search">
          信息搜索
        </Link>
        <Link className="header-link" href="/mock">
          模拟面试
        </Link>
        <div className="header-badge">Public beta</div>
      </nav>
    </header>
  );
}

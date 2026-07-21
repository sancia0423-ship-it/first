import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand-lockup" href="/">
        <span className="brand-mark">SQ</span>
        <span>
          <strong className="brand-title">Sancia Lab</strong>
          <span className="brand-subtitle">个人网站、AI 工具、学习项目</span>
        </span>
      </Link>

      <nav className="header-nav" aria-label="Primary">
        <Link className="header-link" href="/portfolio">
          个人网站
        </Link>
        <Link className="header-link" href="/">
          YouTube 翻译
        </Link>
        <Link className="header-link" href="/search">
          信息搜索
        </Link>
        <Link className="header-link" href="/mock">
          模拟面试
        </Link>
        <div className="header-badge">AI playground</div>
      </nav>
    </header>
  );
}
